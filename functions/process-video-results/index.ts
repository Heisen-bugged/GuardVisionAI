import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import PocketBase from 'pocketbase';

interface PubSubMessage {
  data: string;
}

interface GCSNotificationPayload {
  bucket: string;
  name: string;
}

interface VideoAnnotationResults {
  annotationResults?: Array<{
    shotAnnotations?: Array<{
      startTimeOffset?: { seconds?: string | number; nanos?: number };
      endTimeOffset?: { seconds?: string | number; nanos?: number };
    }>;
    segmentLabelAnnotations?: Array<{
      entity: {
        description: string;
      };
    }>;
  }>;
}

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

cloudEvent('processVideoResults', async (event: CloudEvent<PubSubMessage>) => {
  if (!event.data?.data) {
    console.error('No data in CloudEvent');
    return;
  }

  const messageStr = Buffer.from(event.data.data, 'base64').toString();
  
  let payload: GCSNotificationPayload;
  try {
    payload = JSON.parse(messageStr) as GCSNotificationPayload;
  } catch (err) {
    console.error("Invalid JSON payload", messageStr, err);
    return;
  }

  const bucketName = payload.bucket;
  const fileName = payload.name;
  
  if (!fileName || !fileName.endsWith('.json')) {
    console.log("Not a JSON results file, ignoring.");
    return;
  }

  const assetId = fileName.split('/').pop()?.replace('.json', '');
  if (!assetId) return;

  console.log(`Processing video results for asset: ${assetId}`);

  try {
    const adminPb = await getAdminClient();

    const [fileContents] = await storage.bucket(bucketName).file(fileName).download();
    const results = JSON.parse(fileContents.toString('utf-8')) as VideoAnnotationResults;

    const annotations = results.annotationResults?.[0];
    const shots = annotations?.shotAnnotations || [];
    const labels = annotations?.segmentLabelAnnotations || [];

    const metadataUpdate = {
      shots: shots.length,
      topLabels: labels.slice(0, 5).map((l) => l.entity.description),
      videoProcessedAt: new Date().toISOString()
    };

    await adminPb.collection('assets').update(assetId, {
      status: 'active',
      metadata: metadataUpdate
    });

    console.log(`Successfully processed video results for ${assetId}`);
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
