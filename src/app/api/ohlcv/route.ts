import { NextRequest, NextResponse } from 'next/server';
import { getOHLCVWithFallback, registerPoolForSync } from '@/lib/ohlcv-service';
import { TimeInterval } from '@/types';

const VALID_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const MIN_LIMIT = 1;
const MAX_LIMIT = 1000;

// Address validation regex
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const interval = searchParams.get('interval') || '1h';
  const limitParam = searchParams.get('limit') || '300';

  // Validate required parameters
  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { success: false, error: 'Missing chainId or poolAddress' },
      { status: 400 }
    );
  }

  // Validate pool address format
  const isEVM = EVM_ADDRESS_REGEX.test(poolAddress);
  const isSolana = chainId === 'solana' && SOLANA_ADDRESS_REGEX.test(poolAddress);
  if (!isEVM && !isSolana) {
    return NextResponse.json(
      { success: false, error: 'Invalid pool address format' },
      { status: 400 }
    );
  }

  // Validate interval
  if (!VALID_INTERVALS.includes(interval)) {
    return NextResponse.json(
      { success: false, error: `Invalid interval. Valid: ${VALID_INTERVALS.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate limit
  const limit = parseInt(limitParam, 10);
  if (isNaN(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
    return NextResponse.json(
      { success: false, error: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` },
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
      limit // Already validated above
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
