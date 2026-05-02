import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import video from '@google-cloud/video-intelligence';
import sharp from 'sharp';
import blockhash from 'blockhash-core';
import PocketBase from 'pocketbase';

interface PubSubMessage {
  data: string;
}

interface AssetPayload {
  assetId: string;
  gcsUri: string;
  assetType: 'image' | 'video' | 'clip';
}

const storage = new Storage();
const videoClient = new video.VideoIntelligenceServiceClient();
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Authenticate as Admin
async function getAdminClient() {
  if (!pb.authStore.isValid) {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
  }
  return pb;
}

interface ImageData {
  data: Buffer;
  width: number;
  height: number;
}

// Generate Perceptual Hash
async function generatePHash(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imageData: ImageData = { data, width: info.width, height: info.height };
  const blockhashLib = blockhash as unknown as { bmvbhash: (data: ImageData, bits: number) => string };
  const hash = blockhashLib.bmvbhash(imageData, 16);
  return hash;
}

cloudEvent('processAsset', async (event: CloudEvent<PubSubMessage>) => {
  if (!event.data?.data) {
    console.error('No data in CloudEvent');
    return;
  }

  const messageStr = Buffer.from(event.data.data, 'base64').toString();
  const payload = JSON.parse(messageStr) as AssetPayload;

  const { assetId, gcsUri, assetType } = payload;
  console.log(`Processing asset: ${assetId}, type: ${assetType}`);

  try {
    const adminPb = await getAdminClient();

    // Download file from GCS
    const bucketName = gcsUri.split('/')[2];
    const fileName = gcsUri.split('/').slice(3).join('/');
    const [fileBuffer] = await storage.bucket(bucketName).file(fileName).download();

    if (assetType === 'image') {
      const phash = await generatePHash(fileBuffer);
      
      // Update PocketBase with result
      await adminPb.collection('assets').update(assetId, {
        phash: phash,
        status: 'active'
      });
      console.log(`Successfully processed image ${assetId} with pHash: ${phash}`);
    } 
    else if (assetType === 'video' || assetType === 'clip') {
      // Trigger Video Intelligence API
      const request = {
        inputUri: gcsUri,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features: ['SHOT_CHANGE_DETECTION', 'LABEL_DETECTION'] as any,
        outputUri: `gs://${bucketName}/video-analysis/${assetId}.json`
      };

      // We don't await the result. GCP Video Intelligence will save to outputUri
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [operation] = await videoClient.annotateVideo(request) as any;
      
      console.log(`Started video annotation for ${assetId}. Operation name: ${operation.name}`);
      
      await adminPb.collection('assets').update(assetId, {
        status: 'processing_video'
      });
    }

  } catch (error) {
    console.error('Error processing asset:', error);
    try {
      const adminPb = await getAdminClient();
      await adminPb.collection('assets').update(assetId, {
        status: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
    } catch (dbError) {
      console.error('Failed to update PocketBase with error state:', dbError);
    }
  }
});
