'use client';

import Link from 'next/link';
import { ArrowLeft, Github, ExternalLink, Database, Zap, Globe, LineChart, Layers, Code2, Server, Shield, BookOpen } from 'lucide-react';
import { useState } from 'react';

// 目录结构
const TABLE_OF_CONTENTS = [
  { id: 'overview', title: '项目概览', icon: BookOpen },
  { id: 'tech-stack', title: '技术栈', icon: Layers },
  { id: 'architecture', title: '系统架构', icon: Server },
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
