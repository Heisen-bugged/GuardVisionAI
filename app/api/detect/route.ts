import { NextRequest, NextResponse } from 'next/server';
import { runWebDetection, runYouTubeCrawler } from '@/lib/detection';
import { getAdminClient } from '@/lib/pocketbase';

export async function POST(req: NextRequest) {
  try {
    const { asset_id } = await req.json();

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
    }

    const pb = await getAdminClient();

    // Create a job record
    const job = await pb.collection('detection_jobs').create({
      asset_id,
      job_type: 'full_scan',
      status: 'running',
      started_at: new Date().toISOString(),
    });

    // Run detection in background
    (async () => {
      try {
        await Promise.all([
          runWebDetection(asset_id),
          runYouTubeCrawler(asset_id)
        ]);
        
        await pb.collection('detection_jobs').update(job.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      } catch (err: unknown) {
        await pb.collection('detection_jobs').update(job.id, {
          status: 'failed',
          error_log: err instanceof Error ? err.message : 'An unknown error occurred',
        });
      }
    })();

    return NextResponse.json(job);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}
