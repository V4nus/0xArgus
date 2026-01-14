'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Generate tick data
function generateTickData(currentPrice: number, tickCount: number = 20) {
  const ticks: { price: number; liquidity: number; side: 'bid' | 'ask' }[] = [];

  for (let i = 1; i <= tickCount; i++) {
    const priceOffset = currentPrice * (i * 0.005);
    ticks.push({
      price: currentPrice - priceOffset,
      liquidity: 500000 * Math.exp(-i * 0.15) * (0.5 + Math.random()),
      side: 'bid',
    });
    ticks.push({
      price: currentPrice + priceOffset,
      liquidity: 500000 * Math.exp(-i * 0.15) * (0.5 + Math.random()),
      side: 'ask',
    });
  }

  return ticks.sort((a, b) => b.price - a.price);
}

function formatK(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toFixed(0);
}

export default function LiquidityShowcase() {
  const [ticks, setTicks] = useState<{ price: number; liquidity: number; side: 'bid' | 'ask' }[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    setTicks(generateTickData(2847.32));
    const interval = setInterval(() => {
      setTicks(prev => prev.map(t => ({ ...t, liquidity: t.liquidity * (0.95 + Math.random() * 0.1) })));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.findIndex(ref => ref.current === entry.target);
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    sectionRefs.forEach(ref => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (index: number) => {
    sectionRefs[index]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const maxLiq = Math.max(...ticks.map(t => t.liquidity), 1);
  const bids = ticks.filter(t => t.side === 'bid').slice(0, 10);
  const asks = ticks.filter(t => t.side === 'ask').slice(0, 10);

  const sections = [
    {
      title: 'Real-time Order Book',
      subtitle: 'Bid/Ask depth visualization from concentrated liquidity pools',
      number: '01',
    },
    {
      title: 'Tick Distribution',
      subtitle: 'Liquidity concentration across price ranges in V3/V4 pools',
      number: '02',
    },
    {
      title: 'Depth Heatmap',
      subtitle: 'Visual intensity mapping of liquidity density',
      number: '03',
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Progress indicator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
        {sections.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSection === i
                ? 'bg-green-500 scale-150'
                : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Section 1: Order Book */}
      <section
        ref={sectionRefs[0]}
        className="min-h-screen flex items-center justify-center py-20 relative"
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className={`transition-all duration-700 ${activeSection >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <span className="text-green-500 font-mono text-sm">{sections[0].number}</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-2 mb-4">{sections[0].title}</h2>
            <p className="text-gray-400 text-lg max-w-md">{sections[0].subtitle}</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-400">Bids</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-400">Asks</span>
              </div>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className={`transition-all duration-700 delay-200 ${activeSection >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#627eea] flex items-center justify-center text-sm font-bold">Ξ</div>
                  <span className="font-semibold">ETH/USDC</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500">V3</span>
                </div>
                <span className="text-xs text-gray-500">Live</span>
              </div>

              <div className="space-y-1">
                {asks.slice(0, 6).reverse().map((t, i) => (
                  <div key={`a-${i}`} className="relative h-8 flex items-center text-sm font-mono">
                    <div
                      className="absolute left-0 h-full bg-red-500/15 rounded-r transition-all duration-500"
                      style={{ width: `${(t.liquidity / maxLiq) * 100}%`, transitionDelay: `${i * 50}ms` }}
                    />
                    <div className="relative flex justify-between w-full px-3">
                      <span className="text-red-400">${t.price.toFixed(2)}</span>
                      <span className="text-gray-500">{formatK(t.liquidity)}</span>
                    </div>
                  </div>
                ))}
                <div className="h-10 flex items-center justify-center text-lg font-bold text-white border-y border-[#1a1a1a] my-1">
                  $2,847.32
                </div>
                {bids.slice(0, 6).map((t, i) => (
                  <div key={`b-${i}`} className="relative h-8 flex items-center text-sm font-mono">
                    <div
                      className="absolute right-0 h-full bg-green-500/15 rounded-l transition-all duration-500"
                      style={{ width: `${(t.liquidity / maxLiq) * 100}%`, transitionDelay: `${i * 50}ms` }}
                    />
                    <div className="relative flex justify-between w-full px-3">
                      <span className="text-green-500">${t.price.toFixed(2)}</span>
                      <span className="text-gray-500">{formatK(t.liquidity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        {activeSection === 0 && (
          <button
            onClick={() => scrollToSection(1)}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-500 hover:text-white transition-colors"
          >
            <ChevronDown size={32} />
          </button>
        )}
      </section>

      {/* Section 2: Tick Distribution */}
      <section
        ref={sectionRefs[1]}
        className="min-h-screen flex items-center justify-center py-20 bg-[#080808]"
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Visualization */}
          <div className={`order-2 lg:order-1 transition-all duration-700 delay-200 ${activeSection >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 shadow-2xl">
              <div className="h-64 flex items-end gap-1">
                {ticks.slice(0, 40).map((t, i) => {
                  const h = (t.liquidity / maxLiq) * 100;
                  const isActive = activeSection >= 1;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-500 ${
                        t.side === 'bid' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        height: isActive ? `${h}%` : '0%',
                        opacity: isActive ? 0.6 + (h / 100) * 0.4 : 0,
                        transitionDelay: `${i * 20}ms`
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-4 px-2">
                <span>-10%</span>
                <span className="text-green-500">Current Price</span>
                <span>+10%</span>
              </div>
            </div>
          </div>

          {/* Right: Text */}
          <div className={`order-1 lg:order-2 transition-all duration-700 ${activeSection >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <span className="text-green-500 font-mono text-sm">{sections[1].number}</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-2 mb-4">{sections[1].title}</h2>
            <p className="text-gray-400 text-lg max-w-md">{sections[1].subtitle}</p>
            <ul className="mt-8 space-y-3 text-gray-400">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Each bar represents a price tick
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Height shows liquidity depth
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Real-time updates from chain
              </li>
            </ul>
          </div>
        </div>

        {/* Scroll hint */}
        {activeSection === 1 && (
          <button
            onClick={() => scrollToSection(2)}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-500 hover:text-white transition-colors"
          >
            <ChevronDown size={32} />
          </button>
        )}
      </section>

      {/* Section 3: Heatmap */}
      <section
        ref={sectionRefs[2]}
        className="min-h-screen flex items-center justify-center py-20"
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className={`transition-all duration-700 ${activeSection >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <span className="text-green-500 font-mono text-sm">{sections[2].number}</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-2 mb-4">{sections[2].title}</h2>
            <p className="text-gray-400 text-lg max-w-md">{sections[2].subtitle}</p>
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <div className="h-3 w-32 rounded bg-gradient-to-r from-green-900 via-green-500 to-green-300" />
                <span className="text-sm text-gray-400">Liquidity intensity</span>
              </div>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className={`transition-all duration-700 delay-200 ${activeSection >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 shadow-2xl">
              <div className="grid grid-cols-8 gap-2">
                {ticks.slice(0, 32).map((t, i) => {
                  const intensity = t.liquidity / maxLiq;
                  const color = t.side === 'bid' ? '34, 197, 94' : '239, 68, 68';
                  const isActive = activeSection >= 2;
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-lg transition-all duration-300"
                      style={{
                        backgroundColor: `rgba(${color}, ${isActive ? 0.2 + intensity * 0.6 : 0})`,
                        boxShadow: isActive && intensity > 0.5 ? `0 0 20px rgba(${color}, 0.5)` : 'none',
                        transform: isActive ? 'scale(1)' : 'scale(0.8)',
                        opacity: isActive ? 1 : 0,
                        transitionDelay: `${i * 30}ms`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                <span>Low liquidity</span>
                <span>High liquidity</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
