import sharp from 'sharp';
import blockhash from 'blockhash-core';

interface BlockhashCore {
  bmvbhash: (data: { data: Buffer; width: number; height: number }, bits: number) => string;
}

export async function generatePHash(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = (blockhash as unknown as BlockhashCore).bmvbhash({ data, width: info.width, height: info.height }, 16);
  return hash;
}

// Removing Vertex AI Embeddings (No free tier, not in AI Studio)
export async function generateEmbedding(_mediaBuffer: Buffer, _type: 'image' | 'video'): Promise<number[]> {
  // Return an empty array or zeros as fallback since embeddings are removed
  return new Array(1408).fill(0); 
}

// Removing Google SynthID (No free tier, not in AI Studio)
// For MVP, we will pass through the buffer without watermarking.
// In a future iteration, a visible watermark or local LSB invisible watermark can be added here.
export async function applyWatermark(mediaBuffer: Buffer, _type: 'image' | 'video'): Promise<Buffer> {
  return mediaBuffer;
}

// Removed SynthID Verification
export async function verifyWatermark(_mediaBuffer: Buffer, _type: 'image' | 'video'): Promise<Record<string, unknown>> {
  return { verdict: 'NOT_CHECKED', confidence: 0, note: 'Watermarking disabled for Vercel deployment' };
}

export async function processAsset(_assetId: string, fileBuffer: Buffer, type: 'image' | 'video', contentType: string) {
  try {
    let phash = '';
    if (type === 'image') {
      phash = await generatePHash(fileBuffer);
    }

    const watermarkedBuffer = await applyWatermark(fileBuffer, type);
    
    // Create a Blob from the buffer for PocketBase upload
    // Cast to Uint8Array to satisfy BlobPart type in Node environment
    const watermarkedBlob = new Blob([new Uint8Array(watermarkedBuffer)], { type: contentType });

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
