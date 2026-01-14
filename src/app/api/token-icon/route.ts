import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache directory for token icons
const CACHE_DIR = path.join(process.cwd(), 'public', 'token-cache');

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Get cached icon path
function getCachePath(chain: string, address: string): string {
  return path.join(CACHE_DIR, `${chain}_${address.toLowerCase()}.png`);
}

// Icon source URLs - multiple fallback sources with better coverage
function getIconUrls(chain: string, address: string): string[] {
  const lowercaseAddress = address.toLowerCase();
  const checksumAddress = address; // Keep original case for some APIs
  const urls: string[] = [];

  // DexScreener CDN variations
  urls.push(`https://dd.dexscreener.com/ds-data/tokens/${chain}/${lowercaseAddress}.png`);
  urls.push(`https://dd.dexscreener.com/ds-data/tokens/${chain}/${checksumAddress}.png`);

  // Chain-specific fallbacks
  if (chain === 'base') {
    // Basescan token icons
    urls.push(`https://basescan.org/token/images/${lowercaseAddress}_32.png`);
  }

  if (chain === 'ethereum') {
    // Etherscan token icons
    urls.push(`https://etherscan.io/token/images/${lowercaseAddress}_32.png`);
  }

  if (chain === 'bsc') {
    // BscScan token icons
    urls.push(`https://bscscan.com/token/images/${lowercaseAddress}_32.png`);
    urls.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${checksumAddress}/logo.png`);
  }

  // Trust Wallet assets (EVM chains)
  if (chain === 'base' || chain === 'ethereum' || chain === 'arbitrum' || chain === 'optimism') {
    urls.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${checksumAddress}/logo.png`);
  }

  return urls;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');
  const address = searchParams.get('address');

  if (!chain || !address) {
    return NextResponse.json(
      { error: 'Missing chain or address parameter' },
      { status: 400 }
    );
  }

  ensureCacheDir();
  const cachePath = getCachePath(chain, address);

  // Check if cached version exists and is recent (cache for 7 days)
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const ageMs = Date.now() - stats.mtimeMs;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (ageMs < sevenDays) {
      // Serve cached file
      const imageBuffer = fs.readFileSync(cachePath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=604800', // 7 days browser cache
        },
      });
    }
  }

  // Fetch from source and cache
  const urls = getIconUrls(chain, address);

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://dexscreener.com/',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || '';
        // Verify it's actually an image
        if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Verify buffer is not empty and has valid image header
        if (buffer.length < 100) {
          continue;
        }

        // Save to cache
        try {
          fs.writeFileSync(cachePath, buffer);
          console.log(`[Token Icon] Cached: ${chain}/${address}`);
        } catch (writeErr) {
          console.warn('Failed to cache icon:', cachePath, writeErr);
        }

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType || 'image/png',
            'Cache-Control': 'public, max-age=604800',
          },
        });
      }
    } catch (fetchErr) {
      // Try next URL
      console.warn(`[Token Icon] Failed to fetch from ${url}:`, fetchErr);
      continue;
    }
  }

  // Try DexScreener token search API as last resort
  try {
    console.log(`[Token Icon] Trying DexScreener API for ${chain}/${address}`);
    const searchResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      const pairs = data.pairs || [];
      // Find a pair with an image URL
      for (const pair of pairs) {
        const imageUrl = pair.info?.imageUrl;
        if (imageUrl) {
          console.log(`[Token Icon] Found image URL from API: ${imageUrl}`);
          // Fetch the image from the found URL
          const imgResponse = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (buffer.length > 100) {
              // Save to cache
              try {
                fs.writeFileSync(cachePath, buffer);
                console.log(`[Token Icon] Cached from API: ${chain}/${address}`);
              } catch {
                // ignore
              }

              return new NextResponse(buffer, {
                headers: {
                  'Content-Type': imgResponse.headers.get('Content-Type') || 'image/png',
                  'Cache-Control': 'public, max-age=604800',
                },
              });
            }
          }
        }
      }
    }
  } catch (apiErr) {
    console.warn(`[Token Icon] DexScreener API failed:`, apiErr);
  }

  // All sources failed - return 404
  console.warn(`[Token Icon] No icon found for ${chain}/${address}`);
  return NextResponse.json(
    { error: 'Icon not found' },
    { status: 404 }
  );
}
