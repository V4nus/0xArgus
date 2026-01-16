/**
 * WebSocket Server for Real-Time Price Streaming
 * Provides WebSocket endpoint for clients to subscribe to live price updates
 */

import { NextRequest } from 'next/server';

// Store active WebSocket connections
const connections = new Map<string, Set<WebSocket>>();

// Price cache to avoid duplicate API calls
const priceCache = new Map<
  string,
  { price: number; timestamp: number }
>();
const PRICE_CACHE_TTL = 2000; // 2 seconds

/**
 * GET handler for WebSocket upgrade
 * Usage: ws://localhost:3000/api/ws/price?chainId=base&address=0x...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const address = searchParams.get('address');

  if (!chainId || !address) {
    return new Response('Missing chainId or address', { status: 400 });
  }

  const key = `${chainId}:${address.toLowerCase()}`;

  // Check if WebSocket upgrade is supported
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Create WebSocket connection (Next.js 15+ supports WebSocket in Edge Runtime)
  const { socket, response } = upgradeWebSocket(request);

  // Handle connection
  socket.addEventListener('open', () => {
    console.log(`[WebSocket] Client connected to ${key}`);

    // Add to connections
    if (!connections.has(key)) {
      connections.set(key, new Set());
      startPriceStream(key);
    }
    connections.get(key)!.add(socket);
  });

  socket.addEventListener('close', () => {
    console.log(`[WebSocket] Client disconnected from ${key}`);

    // Remove from connections
    const sockets = connections.get(key);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        connections.delete(key);
        stopPriceStream(key);
      }
    }
  });

  socket.addEventListener('error', (error) => {
    console.error(`[WebSocket] Error on ${key}:`, error);
  });

  return response;
}

/**
 * Start polling price updates for a token
 */
function startPriceStream(key: string) {
  const [chainId, address] = key.split(':');

  // Poll DexScreener API every 2 seconds
  const intervalId = setInterval(async () => {
    try {
      const price = await fetchTokenPrice(chainId, address);

      if (price !== null) {
        // Broadcast to all connected clients
        const sockets = connections.get(key);
        if (sockets) {
          const message = JSON.stringify({
            type: 'price',
            chainId,
            address,
            price,
            timestamp: Date.now(),
          });

          sockets.forEach((socket) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(message);
            }
          });
        }
      }
    } catch (error) {
      console.error(`[WebSocket] Failed to fetch price for ${key}:`, error);
    }
  }, 2000); // 2 second polling (well within 300 req/min limit)

  // Store interval ID for cleanup
  (global as any)[`ws_interval_${key}`] = intervalId;
}

/**
 * Stop price polling when no more clients are connected
 */
function stopPriceStream(key: string) {
  const intervalId = (global as any)[`ws_interval_${key}`];
  if (intervalId) {
    clearInterval(intervalId);
    delete (global as any)[`ws_interval_${key}`];
    console.log(`[WebSocket] Stopped price stream for ${key}`);
  }
}

/**
 * Fetch token price from DexScreener with caching
 */
async function fetchTokenPrice(
  chainId: string,
  address: string
): Promise<number | null> {
  const key = `${chainId}:${address}`;

  // Check cache first
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
        next: { revalidate: 0 }, // Disable Next.js caching
      }
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Find pair matching chainId
      const pair = data.pairs.find(
        (p: any) => p.chainId.toLowerCase() === chainId.toLowerCase()
      ) || data.pairs[0]; // Fallback to first pair

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

/**
 * Helper to upgrade HTTP request to WebSocket
 * This is a simplified implementation - you may need to use a library like 'ws' in production
 */
function upgradeWebSocket(request: NextRequest): {
  socket: WebSocket;
  response: Response;
} {
  // Note: Next.js doesn't natively support WebSocket upgrades in App Router
  // This is a placeholder - see implementation notes below
  throw new Error('WebSocket upgrade not supported in Next.js App Router');
}

/**
 * IMPLEMENTATION NOTE:
 *
 * Next.js App Router does NOT support WebSocket upgrades out of the box.
 *
 * To implement WebSocket support, you have several options:
 *
 * 1. Use a separate WebSocket server (recommended):
 *    - Create a standalone Node.js server using 'ws' library
 *    - Run it on a different port (e.g., 3001)
 *    - Use Nginx to proxy WebSocket connections
 *
 * 2. Use Server-Sent Events (SSE) instead:
 *    - SSE is one-way (server to client) but simpler
 *    - Supported natively in Next.js
 *    - See /api/sse/price route for implementation
 *
 * 3. Use a WebSocket service like Pusher or Ably:
 *    - Third-party managed WebSocket infrastructure
 *    - Handles scaling and reconnection
 *
 * For this project, I recommend implementing SSE as an interim solution,
 * then moving to a dedicated WebSocket server if needed.
 */
