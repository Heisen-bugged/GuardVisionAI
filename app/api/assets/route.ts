import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/pocketbase';
import { uploadToStorage } from '@/lib/storage';
import { processAsset } from '@/lib/processing';

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

    // 1. Create initial record in PocketBase with the original file
    const pbFormData = new FormData();
    pbFormData.append('org_id', orgId);
    pbFormData.append('title', title);
    pbFormData.append('asset_type', assetType);
    pbFormData.append('keywords', JSON.stringify(keywords));
    pbFormData.append('licensed_domains', JSON.stringify(licensedDomains));
    pbFormData.append('status', 'processing');
    
    // Attach the file directly to PocketBase
    pbFormData.append('original_file', file);

    const record = await pb.collection('assets').create(pbFormData);

    // Set the backward-compatible URL
    const originalUrl = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/assets/${record.id}/${record.original_file}`;
    await pb.collection('assets').update(record.id, { gcs_original_url: originalUrl });

    // 2. Trigger processing
    const buffer = Buffer.from(await file.arrayBuffer());
    processAsset(record.id, buffer, assetType === 'video' ? 'video' : 'image', file.type)
      .then(async (results) => {
        // results may contain watermarked_file Blob, embedding, etc.
        const updateData = new FormData();
        
        if (results.watermarkedBlob) {
          updateData.append('watermarked_file', results.watermarkedBlob, `watermarked-${record.id}.${assetType === 'image' ? 'jpg' : 'mp4'}`);
        }
        
        updateData.append('phash', results.phash || '');
        updateData.append('embedding', JSON.stringify(results.embedding || []));
        updateData.append('status', 'active');

        const updatedRecord = await pb.collection('assets').update(record.id, updateData);
        
        // Also set the backward-compatible watermarked URL
        if (updatedRecord.watermarked_file) {
          const watermarkedUrl = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/assets/${record.id}/${updatedRecord.watermarked_file}`;
          await pb.collection('assets').update(record.id, { gcs_watermarked_url: watermarkedUrl });
        }
      })
      .catch(async (err) => {
        await pb.collection('assets').update(record.id, {
          status: 'error',
          metadata: { error: err.message }
        });
      });

    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/assets:', err);
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
      filter: `org_id = "${orgId}"`,
      sort: '-created',
    });

    return NextResponse.json(resultList);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
