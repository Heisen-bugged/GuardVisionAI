import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/pocketbase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id');
    const assetId = searchParams.get('asset_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const pb = await getAdminClient();
    
    let filter = '';
    if (assetId) {
      filter = `asset_id = "${assetId}"`;
    } else if (orgId) {
      // In a real app, you'd filter by asset_id belonging to org_id
      // For MVP, we'll assume org_id has its assets
    }
    
    if (status) {
      filter += (filter ? ' && ' : '') + `status = "${status}"`;
    }

    const resultList = await pb.collection('violations').getList(page, limit, {
      filter,
      sort: '-created',
      expand: 'asset_id',
    });

    return NextResponse.json(resultList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, note } = await req.json();
    const pb = await getAdminClient();
    const record = await pb.collection('violations').update(id, {
      status,
      // note would go into metadata or a separate notes field
    });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
