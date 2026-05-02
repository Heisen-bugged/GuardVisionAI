import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/pocketbase';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';

const storage = new Storage();
const pubsub = new PubSub();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'daps-media-default';
const TOPIC_NAME = process.env.PUBSUB_ASSET_TOPIC || 'asset-uploaded-topic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const orgId = formData.get('org_id') as string;
    const assetType = formData.get('asset_type') as 'image' | 'video' | 'clip';
    const keywords = JSON.parse((formData.get('keywords') as string) || '[]');
    const licensedDomains = JSON.parse((formData.get('licensed_domains') as string) || '[]');

    if (!file || !title || !orgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pb = await getAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Create a dummy initial record in PocketBase to get an ID
    const record = await pb.collection('assets').create({
      org_id: orgId,
      title: title,
      asset_type: assetType,
      keywords: keywords,
      licensed_domains: licensedDomains,
      status: 'uploading'
    });

    // 2. Upload file directly to GCS
    const extension = file.name.split('.').pop();
    const gcsFileName = \`originals/\${record.id}.\${extension}\`;
    const gcsFile = storage.bucket(BUCKET_NAME).file(gcsFileName);
    
    await gcsFile.save(buffer, {
      contentType: file.type,
      resumable: false // Set to true for very large files, false for faster small uploads
    });

    const gcsUri = \`gs://\${BUCKET_NAME}/\${gcsFileName}\`;
    const publicUrl = \`https://storage.googleapis.com/\${BUCKET_NAME}/\${gcsFileName}\`;

    // 3. Update PocketBase with the GCS URLs
    await pb.collection('assets').update(record.id, { 
      gcs_original_url: publicUrl,
      status: 'processing' 
    });

    // 4. Publish to Pub/Sub to trigger asynchronous processing
    const messagePayload = {
      assetId: record.id,
      gcsUri: gcsUri,
      assetType: assetType,
      orgId: orgId
    };

    const dataBuffer = Buffer.from(JSON.stringify(messagePayload));
    await pubsub.topic(TOPIC_NAME).publishMessage({ data: dataBuffer });

    console.log(\`Asset \${record.id} uploaded to GCS and queued for processing.\`);

    // Return 201 immediately! Processing happens in the background.
    return NextResponse.json({ ...record, status: 'processing', gcs_original_url: publicUrl }, { status: 201 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/assets POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const pb = await getAdminClient();
    const resultList = await pb.collection('assets').getList(page, limit, {
      filter: \`org_id = "\${orgId}"\`,
      sort: '-created',
    });

    return NextResponse.json(resultList);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
