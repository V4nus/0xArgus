'use client';

import Link from 'next/link';
import { ArrowLeft, Github, ExternalLink, Database, Zap, Globe, LineChart, Layers, Code2, Server, Shield, BookOpen, GitBranch, Waves } from 'lucide-react';
import { useState } from 'react';

// 目录结构
const TABLE_OF_CONTENTS = [
  { id: 'overview', title: '项目概览', icon: BookOpen },
  { id: 'tech-stack', title: '技术栈', icon: Layers },
  { id: 'architecture', title: '系统架构', icon: Server },
  { id: 'uniswap', title: 'Uniswap 解析原理', icon: GitBranch },
  { id: 'solana', title: 'Solana 解析原理', icon: Waves },
  { id: 'chains', title: '支持的链', icon: Globe },
  { id: 'components', title: '核心组件', icon: Code2 },
  { id: 'api', title: 'API 接口', icon: Zap },
  { id: 'database', title: '数据库结构', icon: Database },
  { id: 'realtime', title: '实时数据', icon: LineChart },
  { id: 'security', title: '安全考虑', icon: Shield },
];

export default function WikiPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
              <span className="text-sm">返回首页</span>
            </Link>
            <span className="text-gray-600">|</span>
            <h1 className="text-lg font-medium">0xArgus 技术文档</h1>
          </div>
          <a
            href="https://github.com/V4nus/0xArgus"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Github size={18} />
            <span className="text-sm hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 overflow-y-auto border-r border-[#1a1a1a] bg-black/50">
          <nav className="p-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-4">目录</h2>
            <ul className="space-y-1">
              {TABLE_OF_CONTENTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === item.id
                          ? 'bg-[#22c55e]/10 text-[#22c55e]'
                          : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <Icon size={16} />
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl mx-auto">
          {/* 项目概览 */}
          <section id="overview" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <BookOpen className="text-[#22c55e]" />
              项目概览
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 mb-6">
                <strong className="text-[#22c55e]">0xArgus</strong> 是一个专门用于分析 AMM (自动做市商) 流动性池的实时分析工具，
                能够将 AMM 流动性转换为订单簿深度信息，揭示隐藏的支撑位和阻力位。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">框架</h3>
                  <p className="text-gray-400">Next.js 16 (App Router)</p>
                </div>
                <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">语言</h3>
                  <p className="text-gray-400">TypeScript 5 + React 19</p>
                </div>
                <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">数据库</h3>
                  <p className="text-gray-400">PostgreSQL + Prisma ORM</p>
                </div>
                <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">代码规模</h3>
                  <p className="text-gray-400">20,000+ 行代码</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">核心功能</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#22c55e] mt-1">•</span>
                  <span><strong>流动性深度分析</strong> - 将 AMM 流动性转换为类订单簿显示</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22c55e] mt-1">•</span>
                  <span><strong>实时图表</strong> - TradingView 风格 K 线图，支持多时间框架</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22c55e] mt-1">•</span>
                  <span><strong>多链支持</strong> - Ethereum, Base, BSC, Solana</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22c55e] mt-1">•</span>
                  <span><strong>DEX 聚合交易</strong> - CoW Protocol + Uniswap Universal Router</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22c55e] mt-1">•</span>
                  <span><strong>多语言</strong> - 支持 6 种语言 (EN, KO, JA, ES, PT, RU)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 技术栈 */}
          <section id="tech-stack" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Layers className="text-[#22c55e]" />
              技术栈
            </h2>

            <div className="space-y-6">
              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#22c55e]">前端框架</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Next.js 16', 'React 19', 'TypeScript 5', 'TailwindCSS 4', 'Three.js', 'lightweight-charts'].map((tech) => (
                    <span key={tech} className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#22c55e]">区块链交互</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['viem 2.44', 'wagmi 3.3', 'ethers 6.16', '@solana/web3.js', 'CoW Protocol SDK', 'Uniswap SDK'].map((tech) => (
                    <span key={tech} className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#22c55e]">数据层</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['PostgreSQL', 'Prisma 7', '@tanstack/react-query', 'WebSocket', 'Server-Sent Events'].map((tech) => (
                    <span key={tech} className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#22c55e]">外部 API</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['DexScreener API', 'GeckoTerminal API', 'Dune Analytics', 'RPC Nodes'].map((tech) => (
                    <span key={tech} className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-gray-300">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 系统架构 */}
          <section id="architecture" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Server className="text-[#22c55e]" />
              系统架构
            </h2>

            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <pre className="text-xs sm:text-sm text-gray-300 overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React 19)                 │
├─────────────────────────────────────────────────────────────┤
│  Pages          │  Components       │  3D Scene             │
│  /              │  Chart            │  OceanBackground      │
│  /pool/[id]     │  LiquidityDepth   │  ParticleField        │
│  /token/[addr]  │  TradePanel       │  LiquidityViz         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Next.js Routes)                  │
├─────────────────────────────────────────────────────────────┤
│  /api/liquidity-depth    │  /api/ohlcv    │  /api/trades    │
│  /api/uniswap-quote      │  /api/trending │  /api/pool      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic (libs/)                    │
├─────────────────────────────────────────────────────────────┤
│  liquidity.ts (V2/V3/V4)  │  solana-liquidity.ts            │
│  cow.ts (交易)             │  realtime.ts (实时数据)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL │ DexScreener │ GeckoTerminal │ RPC Nodes       │
└─────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>

            <h3 className="text-xl font-semibold mb-4">数据流</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm flex items-center justify-center">1</span>
                <span>用户访问池页面 → SSR 获取池元数据 (DexScreener)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm flex items-center justify-center">2</span>
                <span>客户端请求流动性深度 → API 调用 RPC → 返回 bids/asks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm flex items-center justify-center">3</span>
                <span>实时轮询更新 → 价格 (1s) / K线 (10s) / 深度 (6s)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm flex items-center justify-center">4</span>
                <span>用户交易 → CoW/Uniswap 报价 → 签名 → 广播</span>
              </li>
            </ol>
          </section>

          {/* Uniswap 解析原理 */}
          <section id="uniswap" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <GitBranch className="text-[#22c55e]" />
              Uniswap 解析原理
            </h2>

            {/* V2 */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#f97316]">Uniswap V2 - 恒定乘积做市商</h3>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">核心公式</h4>
                <div className="bg-black/50 p-4 rounded-lg font-mono text-center text-lg mb-4">
                  <span className="text-[#22c55e]">x</span> × <span className="text-[#f97316]">y</span> = <span className="text-[#58a6ff]">k</span> (常数)
                </div>
                <p className="text-gray-400 text-sm">
                  其中 x 和 y 是两种代币的储备量，k 是常数。任何交易都必须保持 k 不变。
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">流动性深度计算</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// 1. 从合约读取储备量
const [reserve0, reserve1] = await pool.getReserves()

// 2. 计算当前价格
const price = reserve1 / reserve0  // token1 per token0

// 3. 计算在各价格点的可用流动性
// V2 的流动性沿着 xy=k 曲线均匀分布
// 在价格 P 处，可交换的代币量：
// Δx = x - k/P  (卖出 token0)
// Δy = y - k×P  (买入 token0)

// 4. 生成订单簿深度
for (let priceLevel of priceLevels) {
  const liquidityAtPrice = calculateLiquidityAtPrice(
    reserve0, reserve1, priceLevel
  )
  // 价格 < 当前价格 → bid (买单)
  // 价格 > 当前价格 → ask (卖单)
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h5 className="font-medium text-[#22c55e] mb-2">优点</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 简单直观，易于理解</li>
                    <li>• 任何价格都有流动性</li>
                    <li>• Gas 成本低</li>
                  </ul>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h5 className="font-medium text-[#f85149] mb-2">缺点</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 资本效率低（流动性分散）</li>
                    <li>• 大额交易滑点高</li>
                    <li>• LP 无法选择价格范围</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* V3 */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#a855f7]">Uniswap V3 - 集中流动性</h3>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">核心概念：Tick 系统</h4>
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                  <p className="text-gray-300 mb-2">V3 将价格空间划分为离散的 <span className="text-[#a855f7] font-mono">Tick</span>，每个 Tick 代表一个价格点：</p>
                  <div className="font-mono text-center text-lg my-4">
                    price(i) = 1.0001<sup className="text-[#a855f7]">i</sup>
                  </div>
                  <p className="text-sm text-gray-400">
                    例如：Tick 0 = 价格 1.0，Tick 100 = 价格 1.0001^100 ≈ 1.01005
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">流动性深度解析流程</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// 1. 读取当前状态
const slot0 = await pool.slot0()
const currentTick = slot0.tick
const sqrtPriceX96 = slot0.sqrtPriceX96
const currentLiquidity = await pool.liquidity()

// 2. 扫描 TickBitmap 找到所有初始化的 Tick
// TickBitmap 是 256 位的字，每个 bit 代表一个 Tick
const tickBitmap = await pool.tickBitmap(wordPosition)

// 3. 批量获取 Tick 数据
for (let tick of initializedTicks) {
  const tickData = await pool.ticks(tick)
  // tickData 包含:
  // - liquidityGross: 该 Tick 的总流动性
  // - liquidityNet: 跨越该 Tick 时流动性的净变化
}

// 4. 计算每个价格范围的流动性
// 从当前 Tick 向两侧遍历
let liquidity = currentLiquidity
for (let tick = currentTick; tick > minTick; tick--) {
  if (isInitialized(tick)) {
    liquidity -= tickData[tick].liquidityNet
  }
  // 该 Tick 范围内的流动性 = liquidity
  // 转换为 USD 价值用于显示
}`}
                </pre>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">Tick 位图优化</h4>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-3">
                    直接查询所有 Tick 会消耗大量 RPC 调用。我们使用 <span className="text-[#a855f7]">TickBitmap</span> 优化：
                  </p>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e]">1.</span>
                      <span>每个 word (256 bits) 代表 256 个连续 Tick 的初始化状态</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e]">2.</span>
                      <span>只查询 bit=1 的 Tick，跳过空 Tick</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e]">3.</span>
                      <span>使用 Multicall3 批量获取，减少 RPC 调用 95%</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h5 className="font-medium text-[#22c55e] mb-2">优点</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 资本效率提升 4000x</li>
                    <li>• LP 可选择价格范围</li>
                    <li>• 低滑点（在活跃范围内）</li>
                  </ul>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h5 className="font-medium text-[#f85149] mb-2">复杂性</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 需要扫描多个 Tick</li>
                    <li>• 流动性不连续</li>
                    <li>• Gas 成本较高</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* V4 */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#22c55e]">Uniswap V4 - 单例合约架构</h3>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">架构变化</h4>
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">V3 架构：</p>
                      <p className="font-mono text-sm text-gray-500">每个池 = 独立合约地址 (0x...40字符)</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">V4 架构：</p>
                      <p className="font-mono text-sm text-[#22c55e]">所有池 = PoolManager 内部状态 (PoolId = 32字节)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">PoolId 识别</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// V4 池由 PoolKey 唯一标识
interface PoolKey {
  currency0: address    // 代币 0 地址
  currency1: address    // 代币 1 地址
  fee: uint24          // 手续费等级
  tickSpacing: int24   // Tick 间距
  hooks: address       // Hook 合约地址
}

// PoolId = keccak256(abi.encode(PoolKey))
// 结果是 32 字节 (64 hex 字符)
// 例如: 0x98c8f03094a9e65ccedc14c40130e4a5dd0ce14fb12ea58cbeac11f662b458b9

// 识别方法：
if (poolAddress.length === 66) {  // 0x + 64 chars
  return 'v4'
} else if (poolAddress.length === 42) {  // 0x + 40 chars
  return 'v3' or 'v2'
}`}
                </pre>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-200">状态读取方式</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// V4 使用 StateView 合约读取 PoolManager 内部状态
const STATE_VIEW_ADDRESS = '0x...'  // 链上部署的 StateView 合约

// 1. 获取池状态 (slot0 等效)
const poolState = await stateView.getSlot0(poolId)
// 返回: sqrtPriceX96, tick, protocolFee, lpFee

// 2. 获取流动性
const liquidity = await stateView.getLiquidity(poolId)

// 3. 获取 Tick 数据 - 需要通过 extsload 直接读取存储槽
// V4 的 Tick 数据存储在 PoolManager 的 mapping 中
// 使用 StateView.getTickInfo(poolId, tick) 或直接计算存储槽

// 4. 后续流程与 V3 类似：遍历 Tick，计算流动性分布`}
                </pre>
              </div>

              <div className="bg-[#1a1a1a] p-4 rounded-lg">
                <h5 className="font-medium text-[#22c55e] mb-2">V4 优势</h5>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• <span className="text-[#22c55e]">Flash Accounting</span> - 多跳交易只在最后结算，节省 Gas</li>
                  <li>• <span className="text-[#22c55e]">Hooks</span> - 可编程的交易前/后逻辑</li>
                  <li>• <span className="text-[#22c55e]">Native ETH</span> - 直接支持 ETH，无需包装</li>
                  <li>• <span className="text-[#22c55e]">动态手续费</span> - 可根据市场条件调整</li>
                </ul>
              </div>
            </div>

            {/* 池类型检测 */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">自动池类型检测</h3>
              <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`async function detectPoolType(chainId: string, poolAddress: string) {
  // 1. 根据地址长度初步判断
  if (poolAddress.length === 66) {
    return 'v4'  // 32字节 PoolId
  }

  // 2. 尝试调用 V3 特有方法
  try {
    await contract.slot0()  // V3 有 slot0
    await contract.tickSpacing()  // V3 有 tickSpacing
    return 'v3'
  } catch {
    // 不是 V3
  }

  // 3. 尝试调用 V2 方法
  try {
    await contract.getReserves()  // V2 特有
    return 'v2'
  } catch {
    return 'unknown'
  }
}`}
              </pre>
            </div>
          </section>

          {/* Solana 解析原理 */}
          <section id="solana" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Waves className="text-[#22c55e]" />
              Solana 解析原理
            </h2>

            <p className="text-gray-400 mb-6">
              Solana 上有多种 DEX 协议，每种都有不同的账户结构和流动性模型。我们支持以下协议：
            </p>

            {/* Raydium AMM */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#3b82f6]">Raydium AMM (V4)</h3>

              <div className="mb-4">
                <h4 className="text-lg font-medium mb-3 text-gray-200">账户结构</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// Raydium AMM 使用恒定乘积模型，类似 Uniswap V2
// 但账户结构不同

interface RaydiumAmmPool {
  // 池状态账户
  ammId: PublicKey           // 池地址
  ammAuthority: PublicKey    // PDA 权限
  ammOpenOrders: PublicKey   // Serum 订单簿（已弃用）

  // 代币账户
  poolCoinTokenAccount: PublicKey   // Token A vault
  poolPcTokenAccount: PublicKey     // Token B vault

  // 储备量 - 从代币账户余额读取
  coinReserve: bigint
  pcReserve: bigint
}

// 解析流程：
// 1. 获取池账户数据
const poolData = await connection.getAccountInfo(ammId)
// 2. 解码池结构
const pool = RaydiumAmmLayout.decode(poolData.data)
// 3. 获取代币账户余额作为储备量
const coinBalance = await connection.getTokenAccountBalance(pool.poolCoinTokenAccount)
const pcBalance = await connection.getTokenAccountBalance(pool.poolPcTokenAccount)`}
                </pre>
              </div>
            </div>

            {/* Raydium CLMM */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#8b5cf6]">Raydium CLMM (集中流动性)</h3>

              <div className="mb-4">
                <h4 className="text-lg font-medium mb-3 text-gray-200">与 Uniswap V3 的对比</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">相似点：</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Tick 系统</li>
                      <li>• 集中流动性范围</li>
                      <li>• sqrtPrice 表示</li>
                    </ul>
                  </div>
                  <div className="bg-[#1a1a1a] p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">不同点：</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 账户模型 vs 存储槽</li>
                      <li>• Tick 数据存储在独立账户</li>
                      <li>• 使用 Anchor 框架</li>
                    </ul>
                  </div>
                </div>

                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// Raydium CLMM 账户结构
interface RaydiumClmmPool {
  poolState: PublicKey      // 池状态 PDA
  tickArrays: PublicKey[]   // Tick 数组账户（每个包含多个 Tick）

  // 池状态数据
  sqrtPriceX64: bigint      // 当前价格（Q64.64 格式）
  tickCurrent: number       // 当前 Tick
  liquidity: bigint         // 当前流动性
}

// 解析流程：
// 1. 获取池状态
const poolState = await program.account.poolState.fetch(poolAddress)

// 2. 计算需要查询的 TickArray 账户
// 每个 TickArray 包含 60 个 Tick
const tickArrayPDAs = getTickArrayPDAs(poolAddress, tickCurrent, range)

// 3. 批量获取 TickArray 数据
const tickArrays = await connection.getMultipleAccountsInfo(tickArrayPDAs)

// 4. 遍历 Tick 计算流动性分布
for (const tickArray of tickArrays) {
  for (const tick of tickArray.ticks) {
    if (tick.liquidityGross > 0) {
      // 计算该价格范围的流动性
    }
  }
}`}
                </pre>
              </div>
            </div>

            {/* Meteora DLMM */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#f59e0b]">Meteora DLMM (动态流动性)</h3>

              <div className="mb-4">
                <h4 className="text-lg font-medium mb-3 text-gray-200">Bin 系统</h4>
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                  <p className="text-gray-300 mb-2">
                    Meteora 使用 <span className="text-[#f59e0b] font-semibold">Bin</span> 系统，类似于离散的价格桶：
                  </p>
                  <ul className="text-sm text-gray-400 space-y-2 mt-3">
                    <li>• 每个 Bin 代表一个精确的价格点</li>
                    <li>• 流动性只在 Bin 内有效</li>
                    <li>• 支持更精细的价格控制</li>
                  </ul>
                </div>

                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// 使用 Meteora 官方 SDK
import { DLMM } from '@meteora-ag/dlmm'

async function getMeteoraBinsData(poolAddress: string, priceUsd: number) {
  const connection = getConnection()
  const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress))

  // 1. 获取代币精度 - 必须从链上读取真实值
  const tokenXMint = dlmmPool.lbPair?.tokenXMint
  const tokenYMint = dlmmPool.lbPair?.tokenYMint

  const [tokenXMintInfo, tokenYMintInfo] = await Promise.all([
    connection.getParsedAccountInfo(tokenXMint),
    connection.getParsedAccountInfo(tokenYMint),
  ])

  const tokenXDecimals = tokenXMintInfo.value.data.parsed.info.decimals
  const tokenYDecimals = tokenYMintInfo.value.data.parsed.info.decimals

  // 2. 获取活跃 Bin
  const activeBin = await dlmmPool.getActiveBin()

  // 3. 获取周围的 Bin 数据（500 个 Bin 范围）
  const binsResult = await dlmmPool.getBinsAroundActiveBin(500, 500)

  // 4. 处理 Bin 数据
  const bins = binsResult.bins.map(bin => {
    const xAmount = Number(bin.xAmount) / Math.pow(10, tokenXDecimals)
    const yAmount = Number(bin.yAmount) / Math.pow(10, tokenYDecimals)
    const price = parseFloat(bin.pricePerToken)
    const liquidityUSD = xAmount * priceUsd + yAmount

    return { binId: bin.binId, price, xAmount, yAmount, liquidityUSD }
  }).filter(bin => bin.liquidityUSD > 0)

  return bins
}`}
                </pre>
              </div>
            </div>

            {/* Orca */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#06b6d4]">Orca Whirlpool</h3>

              <div className="mb-4">
                <p className="text-gray-400 mb-4">
                  Orca Whirlpool 是 Solana 上最受欢迎的集中流动性协议之一，结构类似 Uniswap V3。
                </p>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// Orca Whirlpool 账户结构
interface WhirlpoolData {
  whirlpoolsConfig: PublicKey
  whirlpoolBump: number[]
  tickSpacing: number
  tickSpacingSeed: number[]
  feeRate: number
  protocolFeeRate: number
  liquidity: bigint
  sqrtPrice: bigint
  tickCurrentIndex: number
  protocolFeeOwedA: bigint
  protocolFeeOwedB: bigint
  tokenMintA: PublicKey
  tokenVaultA: PublicKey
  feeGrowthGlobalA: bigint
  tokenMintB: PublicKey
  tokenVaultB: PublicKey
  feeGrowthGlobalB: bigint
  rewardLastUpdatedTimestamp: bigint
  rewardInfos: RewardInfo[]
}

// 解析类似 Raydium CLMM，使用 TickArray 账户`}
                </pre>
              </div>
            </div>

            {/* PumpSwap */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-[#ec4899]">PumpSwap (Bonding Curve)</h3>

              <div className="mb-4">
                <h4 className="text-lg font-medium mb-3 text-gray-200">Bonding Curve 模型</h4>
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                  <p className="text-gray-300 mb-2">
                    PumpSwap 使用 <span className="text-[#ec4899] font-semibold">Bonding Curve</span>，价格随购买量增加：
                  </p>
                  <div className="font-mono text-center text-lg my-4">
                    Price = f(Supply) = a × Supply<sup>n</sup>
                  </div>
                </div>

                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`// PumpSwap 池结构
interface PumpSwapPool {
  virtualTokenReserves: bigint   // 虚拟代币储备
  virtualSolReserves: bigint     // 虚拟 SOL 储备
  realTokenReserves: bigint      // 实际代币储备
  realSolReserves: bigint        // 实际 SOL 储备
  tokenTotalSupply: bigint       // 代币总供应
  complete: boolean              // 是否完成 bonding
}

// 当 complete = true 时，迁移到 Raydium AMM
// 此时按 AMM 模式解析

// Bonding Curve 价格计算：
function calculatePrice(pool: PumpSwapPool) {
  const virtualProduct = pool.virtualTokenReserves * pool.virtualSolReserves
  // 模拟购买 1 个代币需要的 SOL
  const newTokenReserves = pool.virtualTokenReserves - 1n
  const newSolReserves = virtualProduct / newTokenReserves
  const price = newSolReserves - pool.virtualSolReserves
  return price
}`}
                </pre>
              </div>
            </div>

            {/* DEX 类型检测 */}
            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">自动 DEX 类型检测</h3>
              <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`function detectSolanaDexType(dexId?: string): SolanaDexType {
  if (!dexId) return 'unknown'

  const dexLower = dexId.toLowerCase()

  // PumpSwap / Pump.fun
  if (dexLower.includes('pump')) return 'pumpswap'

  // Raydium
  if (dexLower.includes('raydium')) {
    if (dexLower.includes('clmm') || dexLower.includes('concentrated')) {
      return 'raydium-clmm'
    }
    return 'raydium-amm'
  }

  // Orca
  if (dexLower.includes('orca') || dexLower.includes('whirlpool')) {
    return 'orca'
  }

  // Meteora
  if (dexLower.includes('meteora') || dexLower.includes('dlmm')) {
    return 'meteora'
  }

  return 'unknown'
}

// 根据 DEX 类型选择解析方法
switch (dexType) {
  case 'pumpswap':
    return parsePumpSwapPool(poolAddress)
  case 'raydium-amm':
    return parseRaydiumAmmPool(poolAddress)
  case 'raydium-clmm':
    return parseRaydiumClmmPool(poolAddress)
  case 'orca':
    return parseOrcaWhirlpool(poolAddress)
  case 'meteora':
    return parseMeteoraDlmmPool(poolAddress)
}`}
              </pre>
            </div>
          </section>

          {/* 支持的链 */}
          <section id="chains" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Globe className="text-[#22c55e]" />
              支持的链
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Ethereum', id: 'ethereum', versions: 'V2/V3', priority: '主网' },
                { name: 'Base', id: 'base', versions: 'V2/V3/V4', priority: '主要' },
                { name: 'BNB Chain', id: 'bsc', versions: 'V2/V3', priority: '支持' },
                { name: 'Solana', id: 'solana', versions: 'Raydium/Orca/Meteora', priority: '部分' },
              ].map((chain) => (
                <div key={chain.id} className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={`/chains/${chain.id}.${chain.id === 'ethereum' || chain.id === 'solana' ? 'png' : 'svg'}`}
                      alt={chain.name}
                      className="w-8 h-8"
                    />
                    <h3 className="text-lg font-semibold">{chain.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">支持版本: {chain.versions}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    chain.priority === '主要' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {chain.priority}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Solana DEX 支持</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['Raydium AMM', 'Raydium CLMM', 'Orca', 'Meteora DLMM', 'PumpSwap'].map((dex) => (
                  <span key={dex} className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-gray-300 text-center">{dex}</span>
                ))}
              </div>
            </div>
          </section>

          {/* 核心组件 */}
          <section id="components" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Code2 className="text-[#22c55e]" />
              核心组件
            </h2>

            <div className="space-y-4">
              {[
                { name: 'Chart.tsx', lines: 823, desc: 'TradingView 风格图表，支持 6 个时间框架，Orders 指标显示流动性线' },
                { name: 'LiquidityDepth.tsx', lines: 965, desc: '流动性深度显示，支持 V2/V3/V4 池，动态精度调整' },
                { name: 'TradePanel.tsx', lines: 1292, desc: '交易界面，CoW Protocol + Uniswap 聚合，MEV 保护' },
                { name: 'OceanBackground.tsx', lines: 541, desc: '3D 海洋波浪背景，Gerstner 波算法' },
                { name: 'SearchBox.tsx', lines: 286, desc: '搜索功能，支持代币符号/地址搜索' },
                { name: 'OrderBookBars.ts', lines: 171, desc: '图表自定义 primitive，显示流动性价格线' },
              ].map((comp) => (
                <div key={comp.name} className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[#22c55e]">{comp.name}</h3>
                    <span className="text-sm text-gray-500">{comp.lines} 行</span>
                  </div>
                  <p className="text-gray-400">{comp.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* API 接口 */}
          <section id="api" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Zap className="text-[#22c55e]" />
              API 接口
            </h2>

            <div className="space-y-4">
              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">核心 API</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left py-2 text-gray-400">路由</th>
                        <th className="text-left py-2 text-gray-400">方法</th>
                        <th className="text-left py-2 text-gray-400">描述</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-[#1a1a1a]/50">
                        <td className="py-2 font-mono text-[#22c55e]">/api/liquidity-depth</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">V2/V3/V4 统一流动性深度</td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]/50">
                        <td className="py-2 font-mono text-[#22c55e]">/api/ohlcv</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">K 线数据</td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]/50">
                        <td className="py-2 font-mono text-[#22c55e]">/api/trades</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">交易历史</td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]/50">
                        <td className="py-2 font-mono text-[#22c55e]">/api/uniswap-quote</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">Uniswap 报价</td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]/50">
                        <td className="py-2 font-mono text-[#22c55e]">/api/trending</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">趋势池排名</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-[#22c55e]">/api/lp-positions</td>
                        <td className="py-2">GET</td>
                        <td className="py-2">LP 头寸查询</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">流动性深度 API 示例</h3>
                <pre className="text-sm text-gray-300 overflow-x-auto bg-black/50 p-4 rounded-lg">
{`GET /api/liquidity-depth?chainId=base&poolAddress=0x...&priceUsd=5.23

Response:
{
  "bids": [
    { "price": 5.20, "liquidityUSD": 150000, "token0Amount": 28846 }
  ],
  "asks": [
    { "price": 5.25, "liquidityUSD": 120000, "token0Amount": 22857 }
  ],
  "currentPrice": 5.23,
  "poolType": "v3"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 数据库结构 */}
          <section id="database" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Database className="text-[#22c55e]" />
              数据库结构
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Pool', desc: '池元数据', fields: 'chainId, poolAddress, dex, priceUsd, liquidity' },
                { name: 'LPPosition', desc: 'LP 头寸', fields: 'owner, tickLower, tickUpper, liquidity, txHash' },
                { name: 'OHLCVCandle', desc: 'K 线数据', fields: 'interval, timestamp, open, high, low, close, volume' },
                { name: 'LiquiditySnapshot', desc: '流动性快照', fields: 'poolId, bidsJson, asksJson, createdAt' },
                { name: 'V4Trade', desc: 'V4 交易事件', fields: 'poolId, type, price, amount, volumeUsd' },
                { name: 'QuotePrice', desc: '报价代币价格', fields: 'symbol, priceUsd, updatedAt' },
              ].map((model) => (
                <div key={model.name} className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#22c55e] mb-2">{model.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{model.desc}</p>
                  <p className="text-xs text-gray-500 font-mono">{model.fields}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 实时数据 */}
          <section id="realtime" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <LineChart className="text-[#22c55e]" />
              实时数据
            </h2>

            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">更新频率配置</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      <th className="text-left py-2 text-gray-400">数据类型</th>
                      <th className="text-left py-2 text-gray-400">更新间隔</th>
                      <th className="text-left py-2 text-gray-400">缓存时间</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-[#1a1a1a]/50">
                      <td className="py-2">价格</td>
                      <td className="py-2 text-[#22c55e]">1 秒</td>
                      <td className="py-2">无</td>
                    </tr>
                    <tr className="border-b border-[#1a1a1a]/50">
                      <td className="py-2">流动性深度</td>
                      <td className="py-2 text-[#22c55e]">6 秒</td>
                      <td className="py-2">5 秒</td>
                    </tr>
                    <tr className="border-b border-[#1a1a1a]/50">
                      <td className="py-2">K 线</td>
                      <td className="py-2 text-[#22c55e]">10 秒</td>
                      <td className="py-2">1 分钟</td>
                    </tr>
                    <tr className="border-b border-[#1a1a1a]/50">
                      <td className="py-2">交易历史</td>
                      <td className="py-2 text-[#22c55e]">5 秒</td>
                      <td className="py-2">30 秒</td>
                    </tr>
                    <tr>
                      <td className="py-2">钱包余额</td>
                      <td className="py-2 text-[#22c55e]">15 秒</td>
                      <td className="py-2">10 秒</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">WebSocket 配置</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 自动重连 (指数退避: 1s → 2s → 4s → 8s → 30s)</li>
                <li>• 心跳 ping (每 30 秒)</li>
                <li>• 断线自动切换到轮询模式</li>
              </ul>
            </div>
          </section>

          {/* 安全考虑 */}
          <section id="security" className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Shield className="text-[#22c55e]" />
              安全考虑
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">交易保护</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Slippage 保护 (可配置)</li>
                  <li>• CoW Protocol MEV 保护</li>
                  <li>• Permit2 标准化签名</li>
                </ul>
              </div>
              <div className="bg-[#0d1117] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">API 安全</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• 输入验证 (地址格式/链 ID)</li>
                  <li>• 基于 IP 的速率限制</li>
                  <li>• 环境变量保护 API 密钥</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[#1a1a1a] pt-8 mt-16">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>© 2024 0xArgus. All rights reserved.</p>
              <a
                href="https://github.com/V4nus/0xArgus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
                View on GitHub
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
