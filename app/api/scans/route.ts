import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/pocketbase';

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminClient();
    const resultList = await pb.collection('detection_jobs').getList(1, 50, {
      sort: '-created',
      expand: 'asset_id',
    });

    return NextResponse.json(resultList);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
