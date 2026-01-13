'use client';

import SearchBox from '@/components/SearchBox';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { Waves, Activity, TrendingDown, ArrowRight, Anchor, Compass } from 'lucide-react';

const ParticleField = dynamic(() => import('@/components/ParticleField'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />,
});

const OceanDepth = dynamic(() => import('@/components/OceanDepth'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#0a1628] rounded-2xl animate-pulse" />
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ocean-themed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1a2d] to-[#061018]" />

      {/* Animated wave overlay */}
      <div className="fixed inset-0 opacity-30">
        <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3fb950" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0d4a2a" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient)"
            d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,218.7C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,218.7C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,128C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,218.7C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>
      </div>

      {/* 3D Particle Background */}
      {mounted && <ParticleField />}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="0xArgus" className="h-8" />
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/V4nus/0xArgus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors text-sm"
            >
              GitHub
            </a>
            <a
              href="https://x.com/0xArgus_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors text-sm"
            >
              Twitter
            </a>
            <LanguageSwitcher />
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
              {/* Left: Text Content */}
              <div className="space-y-8">
                {/* Tagline */}
                <div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3fb950]/30 bg-[#3fb950]/5 text-[#3fb950] text-sm">
                    <Waves size={16} className="animate-pulse" />
                    {t.home.tagline}
                  </span>
                </div>

                {/* Main Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">{t.home.heroTitle}</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#38bdf8] via-[#3fb950] to-[#38bdf8] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    {t.home.heroHighlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                  {t.home.heroSubtitle}
                </p>

                {/* Search Box */}
                <div className="max-w-lg">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#3fb950]/20 via-[#38bdf8]/20 to-[#3fb950]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <SearchBox />
                    </div>
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-3">
                  <FeaturePill
                    icon={<Anchor size={14} />}
                    label={t.home.featureDepth}
                    desc={t.home.featureDepthDesc}
                  />
                  <FeaturePill
                    icon={<Activity size={14} />}
                    label={t.home.featureRealTime}
                    desc={t.home.featureRealTimeDesc}
                  />
                  <FeaturePill
                    icon={<TrendingDown size={14} />}
                    label={t.home.featureImpact}
                    desc={t.home.featureImpactDesc}
                  />
                </div>
              </div>

              {/* Right: Ocean Depth Visualization */}
              <div className="relative">
                {mounted && <OceanDepth />}

                {/* Floating comparison cards */}
                <div className="absolute -bottom-4 -left-4 bg-[#0d1117]/90 backdrop-blur-xl border border-[#30363d] rounded-xl p-4 shadow-2xl">
                  <ComparisonCard
                    type="danger"
                    symbol="HYPE"
                    mcap="$100M"
                    liquidity="$500K"
                    ratio="0.5%"
                  />
                </div>
                <div className="absolute -top-4 -right-4 bg-[#0d1117]/90 backdrop-blur-xl border border-[#30363d] rounded-xl p-4 shadow-2xl">
                  <ComparisonCard
                    type="healthy"
                    symbol="SOLID"
                    mcap="$3M"
                    liquidity="$2M"
                    ratio="66.7%"
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
              <span className="text-gray-500 text-sm mr-2">{t.home.ctaExplore}:</span>
              <QuickLink
                label="PEPE/WETH"
                chain="ETH"
                href="/pool/ethereum/0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"
              />
              <QuickLink
                label="DEGEN/WETH"
                chain="Base"
                href="/pool/base/0xc9034c3e7f58003e6ae0c8438e7c8f4598d5acaa"
              />
              <QuickLink
                label="BRETT/WETH"
                chain="Base"
                href="/pool/base/0x76bf0abd20f1e0155ce40a62615a90a709a6c3d8"
              />
            </div>
          </div>
        </main>

        {/* Bottom Stats */}
        <footer className="py-8 px-6 border-t border-white/5 bg-black/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <StatItem value="6+" label={t.home.chains} icon={<Compass size={16} />} />
              <StatItem value="12K+" label={t.home.pools} icon={<Waves size={16} />} />
              <StatItem value="$2.4B" label={t.common.liquidity} icon={<Anchor size={16} />} />
              <StatItem value="<5s" label={t.home.latency} icon={<Activity size={16} />} />
            </div>
          </div>
        </footer>
      </div>

      {/* CSS for gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

function FeaturePill({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#30363d] bg-[#0d1117]/50 hover:border-[#3fb950]/50 hover:bg-[#3fb950]/5 transition-all cursor-default">
        <span className="text-[#3fb950]">{icon}</span>
        <span className="text-gray-300 text-sm font-medium">{label}</span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {desc}
      </div>
    </div>
  );
}

function ComparisonCard({
  type,
  symbol,
  mcap,
  liquidity,
  ratio,
}: {
  type: 'danger' | 'healthy';
  symbol: string;
  mcap: string;
  liquidity: string;
  ratio: string;
}) {
  const isDanger = type === 'danger';
  return (
    <div className="space-y-2 min-w-[140px]">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold text-sm">{symbol}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isDanger
              ? 'bg-red-500/20 text-red-400'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {isDanger ? 'Risk' : 'Healthy'}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">MCap</span>
          <span className="text-gray-300">{mcap}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Liquidity</span>
          <span className={isDanger ? 'text-red-400' : 'text-green-400'}>{liquidity}</span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${isDanger ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: isDanger ? '8%' : '80%' }}
          />
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold ${isDanger ? 'text-red-400' : 'text-green-400'}`}>
            {ratio}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ label, chain, href }: { label: string; chain: string; href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-[#3fb950]/50 bg-white/5 hover:bg-[#3fb950]/10 transition-all duration-300"
    >
      <span className="text-white group-hover:text-[#3fb950] transition-colors font-medium">
        {label}
      </span>
      <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
        {chain}
      </span>
      <ArrowRight size={14} className="text-gray-600 group-hover:text-[#3fb950] group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function StatItem({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[#3fb950]/60 mb-1">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-[#3fb950]">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500">{label}</div>
    </div>
  );
}
