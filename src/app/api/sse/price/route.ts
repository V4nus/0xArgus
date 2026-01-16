/**
 * Server-Sent Events (SSE) endpoint for real-time price streaming
 * Streams live price updates to connected clients
 *
 * Usage: GET /api/sse/price?chainId=base&address=0x...
 */

import { NextRequest } from 'next/server';

// Global cache to avoid duplicate API calls across connections
const priceCache = new Map<
  string,
  { price: number; timestamp: number }
>();
const PRICE_CACHE_TTL = 1000; // 1 second cache

/**
 * GET handler for SSE connection
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const address = searchParams.get('address');

  if (!chainId || !address) {
    return new Response('Missing chainId or address', { status: 400 });
  }

  const key = `${chainId}:${address.toLowerCase()}`;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      console.log(`[SSE] Client connected to ${key}`);

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', key })}\n\n`)
      );

      // Poll and stream price updates
      const intervalId = setInterval(async () => {
        try {
          const price = await fetchTokenPrice(chainId, address);

          if (price !== null) {
            const data = {
              type: 'price',
              chainId,
              address,
              price,
              timestamp: Date.now(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          }
        } catch (error) {
          console.error(`[SSE] Error fetching price for ${key}:`, error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: 'Failed to fetch price',
              })}\n\n`
            )
          );
        }
      }, 1000); // Stream updates every 1 second

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected from ${key}`);
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  });
}

/**
 * Fetch token price from DexScreener with caching
 */
async function fetchTokenPrice(
  chainId: string,
  address: string
): Promise<number | null> {
  const key = `${chainId}:${address}`;

  // Check cache first to avoid rate limits
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  try {
    // Fetch from DexScreener API
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 }, // Disable Next.js caching for real-time data
      }
    );

    if (!response.ok) {
      console.warn(`DexScreener API returned ${response.status} for ${key}`);
      return null;
    }

    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Find pair matching chainId, or use first pair
      const pair =
        data.pairs.find(
          (p: any) => p.chainId.toLowerCase() === chainId.toLowerCase()
        ) || data.pairs[0];

      const price = parseFloat(pair.priceUsd || '0');

      // Update cache
      priceCache.set(key, { price, timestamp: Date.now() });

      return price;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${key}:`, error);
    return null;
  }
}
