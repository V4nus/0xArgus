import { NextRequest, NextResponse } from 'next/server';
import { getOHLCVWithFallback, registerPoolForSync } from '@/lib/ohlcv-service';
import { TimeInterval } from '@/types';

const VALID_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '300', 10);

  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { success: false, error: 'Missing chainId or poolAddress' },
      { status: 400 }
    );
  }

  if (!VALID_INTERVALS.includes(interval)) {
    return NextResponse.json(
      { success: false, error: `Invalid interval. Valid: ${VALID_INTERVALS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // Register pool for background sync (first-time visitors)
    registerPoolForSync(chainId, poolAddress).catch(console.error);

    // Get OHLCV data (from cache or API fallback)
    const { data, source } = await getOHLCVWithFallback(
      chainId,
      poolAddress,
      interval as TimeInterval,
      Math.min(limit, 1000) // Max 1000 candles
    );

    return NextResponse.json({
      success: true,
      data,
      meta: {
        chainId,
        poolAddress,
        interval,
        count: data.length,
        source, // 'cache' or 'api'
      },
    });
  } catch (error) {
    console.error('OHLCV API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OHLCV data' },
      { status: 500 }
    );
  }
}
