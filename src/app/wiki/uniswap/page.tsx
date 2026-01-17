'use client';

import Link from 'next/link';
import { ArrowLeft, GitBranch } from 'lucide-react';

export default function UniswapWikiPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/wiki" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Docs</span>
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <GitBranch className="text-[#22c55e]" size={20} />
            Uniswap Liquidity Analysis
          </h1>
        </div>
      </header>

      <main className="pt-20 pb-16 px-6 max-w-4xl mx-auto">
        {/* V2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#f97316]">Uniswap V2 - Constant Product Market Maker</h2>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Core Formula</h3>
            <div className="bg-black/50 p-4 rounded-lg font-mono text-center text-xl mb-4">
              <span className="text-[#22c55e]">x</span> × <span className="text-[#f97316]">y</span> = <span className="text-[#58a6ff]">k</span> (constant)
            </div>
            <p className="text-gray-400 text-sm">
              Where x and y are the reserves of two tokens, and k is the constant. Any trade must maintain k unchanged.
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Liquidity Depth Calculation</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// 1. Read reserves from contract
const [reserve0, reserve1] = await pool.getReserves()

// 2. Calculate current price
const price = reserve1 / reserve0  // token1 per token0

// 3. Calculate available liquidity at each price point
// V2 liquidity is uniformly distributed along the xy=k curve
// At price P, the exchangeable token amount:
// Δx = x - k/P  (sell token0)
// Δy = y - k×P  (buy token0)

// 4. Generate order book depth
for (let priceLevel of priceLevels) {
  const liquidityAtPrice = calculateLiquidityAtPrice(
    reserve0, reserve1, priceLevel
  )
  // price < current price → bid (buy order)
  // price > current price → ask (sell order)
}`}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-4">
              <h4 className="font-medium text-[#22c55e] mb-2">Advantages</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Simple and intuitive</li>
                <li>• Liquidity at any price</li>
                <li>• Low gas cost</li>
              </ul>
            </div>
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-4">
              <h4 className="font-medium text-[#f85149] mb-2">Disadvantages</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Low capital efficiency</li>
                <li>• High slippage for large trades</li>
                <li>• LPs cannot choose price range</li>
              </ul>
            </div>
          </div>
        </section>

        {/* V3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#a855f7]">Uniswap V3 - Concentrated Liquidity</h2>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Core Concept: Tick System</h3>
            <p className="text-gray-300 mb-4">V3 divides the price space into discrete <span className="text-[#a855f7] font-mono">Ticks</span>, each representing a price point:</p>
            <div className="bg-black/50 p-4 rounded-lg font-mono text-center text-lg mb-4">
              price(i) = 1.0001<sup className="text-[#a855f7]">i</sup>
            </div>
            <p className="text-sm text-gray-400">
              Example: Tick 0 = price 1.0, Tick 100 = price 1.0001^100 ≈ 1.01005
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Liquidity Depth Parsing Process</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// 1. Read current state
const slot0 = await pool.slot0()
const currentTick = slot0.tick
const sqrtPriceX96 = slot0.sqrtPriceX96
const currentLiquidity = await pool.liquidity()

// 2. Scan TickBitmap to find all initialized Ticks
// TickBitmap is a 256-bit word, each bit represents a Tick
const tickBitmap = await pool.tickBitmap(wordPosition)

// 3. Batch fetch Tick data
for (let tick of initializedTicks) {
  const tickData = await pool.ticks(tick)
  // tickData contains:
  // - liquidityGross: total liquidity at this Tick
  // - liquidityNet: net liquidity change when crossing this Tick
}

// 4. Calculate liquidity for each price range
let liquidity = currentLiquidity
for (let tick = currentTick; tick > minTick; tick--) {
  if (isInitialized(tick)) {
    liquidity -= tickData[tick].liquidityNet
  }
}`}
            </pre>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Tick Bitmap Optimization</h3>
            <p className="text-gray-400 text-sm mb-3">
              Directly querying all Ticks would consume many RPC calls. We use <span className="text-[#a855f7]">TickBitmap</span> optimization:
            </p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li><span className="text-[#22c55e]">1.</span> Each word (256 bits) represents initialization status of 256 consecutive Ticks</li>
              <li><span className="text-[#22c55e]">2.</span> Only query Ticks where bit=1, skip empty Ticks</li>
              <li><span className="text-[#22c55e]">3.</span> Use Multicall3 for batch fetching, reducing RPC calls by 95%</li>
            </ul>
          </div>
        </section>

        {/* V4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#22c55e]">Uniswap V4 - Singleton Contract Architecture</h2>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Architecture Changes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">V3 Architecture:</p>
                <p className="font-mono text-sm text-gray-500">Each pool = Separate contract address<br/>(0x...40 characters)</p>
              </div>
              <div className="bg-black/50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">V4 Architecture:</p>
                <p className="font-mono text-sm text-[#22c55e]">All pools = Internal state in PoolManager<br/>(PoolId = 32 bytes)</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">PoolId Identification</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// V4 pools are uniquely identified by PoolKey
interface PoolKey {
  currency0: address    // Token 0 address
  currency1: address    // Token 1 address
  fee: uint24          // Fee tier
  tickSpacing: int24   // Tick spacing
  hooks: address       // Hook contract address
}

// PoolId = keccak256(abi.encode(PoolKey))
// Result is 32 bytes (64 hex characters)
// Example: 0x98c8f03094a9e65ccedc14c40130e4a5...

// Detection method:
if (poolAddress.length === 66) {  // 0x + 64 chars
  return 'v4'
} else if (poolAddress.length === 42) {  // 0x + 40 chars
  return 'v3' or 'v2'
}`}
            </pre>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">State Reading Method</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// V4 uses StateView contract to read PoolManager internal state

// 1. Get pool state (slot0 equivalent)
const poolState = await stateView.getSlot0(poolId)
// Returns: sqrtPriceX96, tick, protocolFee, lpFee

// 2. Get liquidity
const liquidity = await stateView.getLiquidity(poolId)

// 3. Get Tick data
// Use StateView.getTickInfo(poolId, tick)

// 4. Subsequent process is similar to V3`}
            </pre>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-3 text-[#22c55e]">V4 Advantages</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• <span className="text-[#22c55e]">Flash Accounting</span> - Multi-hop trades settle only at the end, saving gas</li>
              <li>• <span className="text-[#22c55e]">Hooks</span> - Programmable pre/post trade logic</li>
              <li>• <span className="text-[#22c55e]">Native ETH</span> - Direct ETH support, no wrapping needed</li>
              <li>• <span className="text-[#22c55e]">Dynamic Fees</span> - Can adjust based on market conditions</li>
            </ul>
          </div>
        </section>

        {/* Pool Type Detection */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Automatic Pool Type Detection</h2>
          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`async function detectPoolType(chainId: string, poolAddress: string) {
  // 1. Initial check based on address length
  if (poolAddress.length === 66) {
    return 'v4'  // 32-byte PoolId
  }

  // 2. Try calling V3-specific methods
  try {
    await contract.slot0()
    await contract.tickSpacing()
    return 'v3'
  } catch {
    // Not V3
  }

  // 3. Try calling V2 methods
  try {
    await contract.getReserves()
    return 'v2'
  } catch {
    return 'unknown'
  }
}`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}
