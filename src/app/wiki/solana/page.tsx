'use client';

import Link from 'next/link';
import { ArrowLeft, Waves } from 'lucide-react';

export default function SolanaWikiPage() {
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
            <Waves className="text-[#22c55e]" size={20} />
            Solana DEX Analysis
          </h1>
        </div>
      </header>

      <main className="pt-20 pb-16 px-6 max-w-4xl mx-auto">
        <p className="text-gray-400 mb-8">
          Solana has multiple DEX protocols, each with different account structures and liquidity models.
        </p>

        {/* Raydium AMM */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#3b82f6]">Raydium AMM (V4)</h2>
          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-3">Account Structure</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// Raydium AMM uses constant product model, similar to Uniswap V2

interface RaydiumAmmPool {
  ammId: PublicKey           // Pool address
  ammAuthority: PublicKey    // PDA authority
  poolCoinTokenAccount: PublicKey   // Token A vault
  poolPcTokenAccount: PublicKey     // Token B vault
  coinReserve: bigint
  pcReserve: bigint
}

// Parsing process:
const poolData = await connection.getAccountInfo(ammId)
const pool = RaydiumAmmLayout.decode(poolData.data)
const coinBalance = await connection.getTokenAccountBalance(
  pool.poolCoinTokenAccount
)`}
            </pre>
          </div>
        </section>

        {/* Raydium CLMM */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#8b5cf6]">Raydium CLMM (Concentrated Liquidity)</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Similar to V3:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Tick system</li>
                <li>• Concentrated liquidity ranges</li>
                <li>• sqrtPrice representation</li>
              </ul>
            </div>
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Differences:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Account model vs storage slots</li>
                <li>• Ticks stored in separate accounts</li>
                <li>• Uses Anchor framework</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`interface RaydiumClmmPool {
  poolState: PublicKey
  tickArrays: PublicKey[]   // Each contains 60 Ticks
  sqrtPriceX64: bigint
  tickCurrent: number
  liquidity: bigint
}

// Parsing process:
const poolState = await program.account.poolState.fetch(poolAddress)
const tickArrayPDAs = getTickArrayPDAs(poolAddress, tickCurrent, range)
const tickArrays = await connection.getMultipleAccountsInfo(tickArrayPDAs)`}
            </pre>
          </div>
        </section>

        {/* Meteora DLMM */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#f59e0b]">Meteora DLMM (Dynamic Liquidity)</h2>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Bin System</h3>
            <p className="text-gray-300 mb-4">
              Meteora uses a <span className="text-[#f59e0b] font-semibold">Bin</span> system, similar to discrete price buckets:
            </p>
            <ul className="text-sm text-gray-400 space-y-1 mb-4">
              <li>• Each Bin represents a precise price point</li>
              <li>• Liquidity is only active within the Bin</li>
              <li>• Supports finer price control</li>
            </ul>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`import { DLMM } from '@meteora-ag/dlmm'

async function getMeteoraBinsData(poolAddress: string, priceUsd: number) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress))

  // 1. Get token decimals - must read from chain
  const tokenXMint = dlmmPool.lbPair?.tokenXMint
  const [tokenXMintInfo, tokenYMintInfo] = await Promise.all([
    connection.getParsedAccountInfo(tokenXMint),
    connection.getParsedAccountInfo(tokenYMint),
  ])

  // 2. Get Bin data (500 range)
  const binsResult = await dlmmPool.getBinsAroundActiveBin(500, 500)

  // 3. Process data
  const bins = binsResult.bins.map(bin => ({
    binId: bin.binId,
    price: parseFloat(bin.pricePerToken),
    liquidityUSD: xAmount * priceUsd + yAmount
  }))
}`}
            </pre>
          </div>
        </section>

        {/* Orca */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#06b6d4]">Orca Whirlpool</h2>
          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <p className="text-gray-400 mb-4">
              Orca Whirlpool is the most popular concentrated liquidity protocol on Solana, with a structure similar to Uniswap V3.
            </p>
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`interface WhirlpoolData {
  tickSpacing: number
  feeRate: number
  liquidity: bigint
  sqrtPrice: bigint
  tickCurrentIndex: number
  tokenMintA: PublicKey
  tokenVaultA: PublicKey
  tokenMintB: PublicKey
  tokenVaultB: PublicKey
}

// Parsing similar to Raydium CLMM, using TickArray accounts`}
            </pre>
          </div>
        </section>

        {/* PumpSwap */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#ec4899]">PumpSwap (Bonding Curve)</h2>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">Bonding Curve Model</h3>
            <p className="text-gray-300 mb-4">
              PumpSwap uses a <span className="text-[#ec4899] font-semibold">Bonding Curve</span>, where price increases with purchase amount:
            </p>
            <div className="bg-black/50 p-4 rounded-lg font-mono text-center text-lg mb-4">
              Price = f(Supply) = a × Supply<sup>n</sup>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`interface PumpSwapPool {
  virtualTokenReserves: bigint
  virtualSolReserves: bigint
  realTokenReserves: bigint
  realSolReserves: bigint
  tokenTotalSupply: bigint
  complete: boolean  // Once complete, migrates to Raydium AMM
}

function calculatePrice(pool: PumpSwapPool) {
  const virtualProduct = pool.virtualTokenReserves * pool.virtualSolReserves
  const newTokenReserves = pool.virtualTokenReserves - 1n
  const newSolReserves = virtualProduct / newTokenReserves
  return newSolReserves - pool.virtualSolReserves
}`}
            </pre>
          </div>
        </section>

        {/* DEX Type Detection */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Automatic DEX Type Detection</h2>
          <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`function detectSolanaDexType(dexId?: string): SolanaDexType {
  if (!dexId) return 'unknown'
  const dexLower = dexId.toLowerCase()

  if (dexLower.includes('pump')) return 'pumpswap'
  if (dexLower.includes('raydium')) {
    return dexLower.includes('clmm') ? 'raydium-clmm' : 'raydium-amm'
  }
  if (dexLower.includes('orca')) return 'orca'
  if (dexLower.includes('meteora')) return 'meteora'

  return 'unknown'
}`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}
