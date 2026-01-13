import { NextRequest, NextResponse } from 'next/server';
import { syncPoolOHLCV, syncPoolAllIntervals, runSyncJob, getSyncStatus } from '@/lib/ohlcv-service';
import { TimeInterval } from '@/types';

// Secret key for protecting sync endpoint (set in .env)
const SYNC_SECRET = process.env.OHLCV_SYNC_SECRET || 'dev-secret';

/**
 * POST /api/ohlcv/sync
 * Trigger OHLCV sync for a specific pool or run background job
 *
 * Body:
 * - chainId: string (optional if running job)
 * - poolAddress: string (optional if running job)
 * - interval: string (optional, sync all if not provided)
 * - runJob: boolean (run background sync job for all active pools)
 *
 * Headers:
 * - x-sync-secret: string (required in production)
 */
export async function POST(request: NextRequest) {
  // Verify secret in production
  const secret = request.headers.get('x-sync-secret');
  if (process.env.NODE_ENV === 'production' && secret !== SYNC_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { chainId, poolAddress, interval, runJob } = body;

    // Run background sync job
    if (runJob) {
      await runSyncJob();
      return NextResponse.json({
        success: true,
        message: 'Sync job completed',
      });
    }

    // Sync specific pool
    if (!chainId || !poolAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing chainId or poolAddress' },
        { status: 400 }
      );
    }

    if (interval) {
      // Sync single interval
      const result = await syncPoolOHLCV(chainId, poolAddress, interval as TimeInterval);
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    } else {
      // Sync all intervals
      const results = await syncPoolAllIntervals(chainId, poolAddress);
      return NextResponse.json({
        success: true,
        data: results,
      });
    }
  } catch (error) {
    console.error('OHLCV sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ohlcv/sync?chainId=...&poolAddress=...
 * Get sync status for a pool
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');

  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { success: false, error: 'Missing chainId or poolAddress' },
      { status: 400 }
    );
  }

  try {
    const status = await getSyncStatus(chainId, poolAddress);
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('OHLCV status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
