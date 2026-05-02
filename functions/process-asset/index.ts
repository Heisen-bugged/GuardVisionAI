import functions from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import video from '@google-cloud/video-intelligence';
import sharp from 'sharp';
import blockhash from 'blockhash-core';
import PocketBase from 'pocketbase';

const storage = new Storage();
const pubsub = new PubSub();
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

// Generate Perceptual Hash
async function generatePHash(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBuffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = (blockhash as any).bmvbhash({ data, width: info.width, height: info.height }, 16);
  return hash;
}

functions.cloudEvent('processAsset', async (cloudEvent) => {
  const base64Data = (cloudEvent.data as any).message.data;
  const messageStr = Buffer.from(base64Data, 'base64').toString();
  const payload = JSON.parse(messageStr);

  const { assetId, gcsUri, assetType } = payload;
  console.log(\`Processing asset: \${assetId}, type: \${assetType}\`);

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
      console.log(\`Successfully processed image \${assetId} with pHash: \${phash}\`);
    } 
    else if (assetType === 'video' || assetType === 'clip') {
      // Trigger Video Intelligence API
      const request = {
        inputUri: gcsUri,
        features: ['SHOT_CHANGE_DETECTION', 'LABEL_DETECTION'],
        outputUri: \`gs://\${bucketName}/video-analysis/\${assetId}.json\`
      };

      // We don't await the result. GCP Video Intelligence will save to outputUri
      // and we can trigger another function on object finalization, or use a Pub/Sub topic
      const [operation] = await videoClient.annotateVideo(request);
      
      console.log(\`Started video annotation for \${assetId}. Operation name: \${operation.name}\`);
      
      // In a real system, you could configure the Video Intelligence API to send a Pub/Sub
      // notification when done, or trigger another function when the output JSON is written to GCS.
      // For now, we update status to processing_video
      await adminPb.collection('assets').update(assetId, {
        status: 'processing_video'
      });
    }

  } catch (error) {
    console.error('Error processing asset:', error);
    // Best effort to mark as error
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
