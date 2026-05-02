import functions from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import PocketBase from 'pocketbase';

const storage = new Storage();
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function getAdminClient() {
  if (!pb.authStore.isValid) {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
  }
  return pb;
}

functions.cloudEvent('processVideoResults', async (cloudEvent) => {
  const base64Data = (cloudEvent.data as any).message.data;
  const messageStr = Buffer.from(base64Data, 'base64').toString();
  
  // This expects a Pub/Sub message triggered by GCS object finalization,
  // or a custom message passed from the Video Intelligence API completion.
  // For simplicity, assuming the payload has bucket/name if from GCS notification.
  let payload: any;
  try {
    payload = JSON.parse(messageStr);
  } catch (e) {
    console.error("Invalid JSON payload", messageStr);
    return;
  }

  // If this was a GCS notification:
  const bucketName = payload.bucket;
  const fileName = payload.name;
  
  if (!fileName || !fileName.endsWith('.json')) {
    console.log("Not a JSON results file, ignoring.");
    return;
  }

  // Filename is like "video-analysis/{assetId}.json"
  const assetId = fileName.split('/').pop()?.replace('.json', '');
  if (!assetId) return;

  console.log(\`Processing video results for asset: \${assetId}\`);

  try {
    const adminPb = await getAdminClient();

    // Download the JSON results
    const [fileContents] = await storage.bucket(bucketName).file(fileName).download();
    const results = JSON.parse(fileContents.toString('utf-8'));

    // Extract segments and labels
    const annotations = results.annotationResults?.[0];
    const shots = annotations?.shotAnnotations || [];
    const labels = annotations?.segmentLabelAnnotations || [];

    // In a full implementation, you would extract keyframes from the shots
    // and generate pHashes for each keyframe here.
    // For MVP, we save the segment metadata back to the asset.

    const metadataUpdate = {
      shots: shots.length,
      topLabels: labels.slice(0, 5).map((l: any) => l.entity.description),
      videoProcessedAt: new Date().toISOString()
    };

    await adminPb.collection('assets').update(assetId, {
      status: 'active',
      metadata: metadataUpdate
    });

    console.log(\`Successfully processed video results for \${assetId}\`);
  } catch (error) {
    console.error('Error processing video results:', error);
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
