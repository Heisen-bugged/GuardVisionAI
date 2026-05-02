import { google } from 'googleapis';
import { getAdminClient } from './pocketbase';
import { generatePHash } from './processing';

const youtube = google.youtube('v3');
const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface Asset {
  id: string;
  title: string;
  keywords?: string[];
  asset_type: 'image' | 'video' | 'clip';
  gcs_original_url?: string;
  licensed_domains?: string[];
  phash?: string;
}

export async function runYouTubeCrawler(assetId: string) {
  const pb = await getAdminClient();
  const asset = await pb.collection('assets').getOne(assetId) as unknown as Asset;
  const keywords = asset.keywords || [];

  console.log(`Starting YouTube crawl for asset: ${asset.title}`);

  for (const query of keywords) {
    try {
      const res = await youtube.search.list({
        key: process.env.YOUTUBE_API_KEY,
        q: query,
        part: ['snippet'],
        type: ['video'],
        maxResults: 10,
        publishedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24h
      });

      const items = res.data.items || [];
      for (const item of items) {
        const videoId = item.id?.videoId;
        const thumbnail = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url;

        if (thumbnail && videoId) {
          // Process thumbnail for matching
          const thumbRes = await fetch(thumbnail);
          const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
          
          await matchAndReportViolation({
            asset,
            sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
            platform: 'youtube',
            mediaBuffer: thumbBuffer,
            metadata: item as unknown as Record<string, unknown>,
          });
        }
      }
    } catch (error) {
      console.error(`YouTube crawl error for query "${query}":`, error);
    }
  }
}

export async function runWebDetection(assetId: string) {
  const pb = await getAdminClient();
  const asset = await pb.collection('assets').getOne(assetId) as unknown as Asset;
  
  if (asset.asset_type !== 'image') return;

  console.log(`Starting Web Detection for asset: ${asset.title}`);

  const payload = {
    requests: [
      {
        image: {
          source: {
            imageUri: asset.gcs_original_url, // Vercel Blob URLs are publicly accessible
          },
        },
        features: [{ type: 'WEB_DETECTION', maxResults: 50 }],
      },
    ],
  };

  try {
    const res = await fetch(`${VISION_URL}?key=${process.env.VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const webDetection = data.responses?.[0]?.webDetection;

    if (webDetection) {
      const matches = [
        ...(webDetection.fullMatchingImages || []).map((m: { url: string }) => ({ ...m, type: 'exact' })),
        ...(webDetection.partialMatchingImages || []).map((m: { url: string }) => ({ ...m, type: 'partial' })),
      ];

      for (const match of matches) {
        await matchAndReportViolation({
          asset,
          sourceUrl: match.url,
          platform: 'web',
          matchType: match.type,
          confidence: match.type === 'exact' ? 0.95 : 0.8,
        });
      }
    }
  } catch (error) {
    console.error('Web detection error:', error);
  }
}

async function matchAndReportViolation({ 
  asset, 
  sourceUrl, 
  platform, 
  mediaBuffer, 
  matchType, 
  confidence, 
  metadata 
}: {
  asset: Asset;
  sourceUrl: string;
  platform: string;
  mediaBuffer?: Buffer;
  matchType?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}) {
  const pb = await getAdminClient();

  // 1. Check if domain is licensed
  const isLicensed = asset.licensed_domains?.some((d: string) => sourceUrl.includes(d));
  if (isLicensed) return;

  let finalConfidence = confidence || 0;
  let finalMatchType = matchType || 'semantic';

  // 2. Perform deep matching if buffer is provided
  if (mediaBuffer && asset.phash) {
    try {
      // Perceptual Hashing
      const discoveredPHash = await generatePHash(mediaBuffer);
      const distance = calculateHammingDistance(asset.phash, discoveredPHash);
      
      if (distance <= 10) {
        finalConfidence = Math.max(finalConfidence, 0.9);
        finalMatchType = 'exact';
      }
    } catch (err) {
      console.error('Deep matching failed:', err);
    }
  }

  // 3. Create Violation record if confidence is high enough
  if (finalConfidence >= 0.7) {
    await pb.collection('violations').create({
      asset_id: asset.id,
      source_url: sourceUrl,
      platform,
      match_type: finalMatchType,
      confidence: finalConfidence,
      status: 'pending_review',
      metadata,
    });
    console.log(`Violation detected! Asset: ${asset.title}, URL: ${sourceUrl}, Confidence: ${finalConfidence}`);
  }
}

function calculateHammingDistance(h1: string, h2: string): number {
  if (!h1 || !h2 || h1.length !== h2.length) return 999;
  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) distance++;
  }
  return distance;
}
