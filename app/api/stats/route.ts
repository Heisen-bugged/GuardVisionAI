import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/pocketbase';

interface PocketBaseError {
  status: number;
  message: string;
  response?: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const pb = await getAdminClient();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    // 1. KPI Stats
    const [totalAssets, openViolations, scansToday, resolvedThisWeek] = await Promise.all([
      pb.collection('assets').getList(1, 1, {
        filter: `org_id = "${orgId}"`,
        requestKey: null,
      }),
      pb.collection('violations').getList(1, 1, {
        filter: `status = "pending_review" && asset_id.org_id = "${orgId}"`,
        requestKey: null,
      }),
      pb.collection('detection_jobs').getList(1, 1, {
        filter: `created >= "${startOfDay.toISOString().replace('T', ' ')}" && asset_id.org_id = "${orgId}"`,
        requestKey: null,
      }),
      pb.collection('violations').getList(1, 1, {
        filter: `status = "resolved" && updated >= "${startOfWeek.toISOString().replace('T', ' ')}" && asset_id.org_id = "${orgId}"`,
        requestKey: null,
      }),
    ]);

    // 2. Trend Data (Last 7 days)
    const trendDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      return { d, dayStart, dayEnd };
    });

    const trendResults = await Promise.all(trendDays.map(day => 
      pb.collection('violations').getList(1, 1, {
        filter: `asset_id.org_id = "${orgId}" && created >= "${day.dayStart.toISOString().replace('T', ' ')}" && created <= "${day.dayEnd.toISOString().replace('T', ' ')}"`,
        requestKey: null,
      })
    ));

    const trendData = trendDays.map((day, i) => ({
      name: day.d.toLocaleDateString('en-US', { weekday: 'short' }),
      violations: trendResults[i].totalItems,
    }));

    // 3. Platform Distribution
    const platforms = ['youtube', 'web', 'twitter', 'instagram'];
    const platformData = await Promise.all(platforms.map(async (p) => {
      const res = await pb.collection('violations').getList(1, 1, {
        filter: `platform = "${p}" && asset_id.org_id = "${orgId}"`,
        requestKey: null,
      });
      return {
        name: p.charAt(0).toUpperCase() + p.slice(1),
        value: res.totalItems,
      };
    }));

    // 4. Recent Activity (Latest 5 violations)
    const recentActivity = await pb.collection('violations').getList(1, 5, {
      filter: `asset_id.org_id = "${orgId}"`,
      sort: '-created',
      expand: 'asset_id',
    });

    return NextResponse.json({
      totalAssets: totalAssets.totalItems,
      openViolations: openViolations.totalItems,
      scansToday: scansToday.totalItems,
      resolvedThisWeek: resolvedThisWeek.totalItems,
      trendData,
      platformData,
      recentActivity: recentActivity.items,
    });
  } catch (error: unknown) {
    console.error('Stats API Error:', error);
    
    const pbError = error as PocketBaseError;
    
    // Check if it's a PocketBase error
    if (pbError.status === 0) {
      return NextResponse.json({ 
        error: 'Could not connect to PocketBase. Please ensure it is running on ' + (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090')
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: pbError.message || 'An unexpected error occurred',
      details: pbError.response || null
    }, { status: pbError.status || 500 });
  }
}
