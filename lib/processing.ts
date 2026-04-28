import sharp from 'sharp';
import blockhash from 'blockhash-core';

export async function generatePHash(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = (blockhash as { bmvbhash: (data: { data: Buffer; width: number; height: number }, bits: number) => string }).bmvbhash({ data, width: info.width, height: info.height }, 16);
  return hash;
}

// Removing Vertex AI Embeddings (No free tier, not in AI Studio)
export async function generateEmbedding(mediaBuffer: Buffer, type: 'image' | 'video'): Promise<number[]> {
  // Return an empty array or zeros as fallback since embeddings are removed
  return new Array(1408).fill(0); 
}

// Removing Google SynthID (No free tier, not in AI Studio)
// For MVP, we will pass through the buffer without watermarking.
// In a future iteration, a visible watermark or local LSB invisible watermark can be added here.
export async function applyWatermark(mediaBuffer: Buffer, type: 'image' | 'video'): Promise<Buffer> {
  return mediaBuffer;
}

// Removed SynthID Verification
export async function verifyWatermark(mediaBuffer: Buffer, type: 'image' | 'video'): Promise<Record<string, unknown>> {
  return { verdict: 'NOT_CHECKED', confidence: 0, note: 'Watermarking disabled for Vercel deployment' };
}

export async function processAsset(assetId: string, fileBuffer: Buffer, type: 'image' | 'video', contentType: string) {
  try {
    let phash = '';
    if (type === 'image') {
      phash = await generatePHash(fileBuffer);
    }

    const watermarkedBuffer = await applyWatermark(fileBuffer, type);
    
    // Create a Blob from the buffer for PocketBase upload
    const watermarkedBlob = new Blob([watermarkedBuffer], { type: contentType });

    const embedding = await generateEmbedding(fileBuffer, type);

    return {
      phash,
      watermarkedBlob,
      embedding,
    };
  } catch (error) {
    console.error('Error processing asset:', error);
    throw error;
  }
}
