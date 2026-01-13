'use client';

import { useEffect, useRef, useState } from 'react';

interface DepthLayer {
  depth: number; // 0-100%
  liquidity: number; // Normalized 0-1
  label: string;
  value: string;
}

const DEPTH_LAYERS: DepthLayer[] = [
  { depth: 0, liquidity: 1.0, label: 'Surface', value: '$1.00' },
  { depth: 15, liquidity: 0.85, label: '-1%', value: '$0.99' },
  { depth: 30, liquidity: 0.65, label: '-2%', value: '$0.98' },
  { depth: 45, liquidity: 0.45, label: '-5%', value: '$0.95' },
  { depth: 60, liquidity: 0.25, label: '-10%', value: '$0.90' },
  { depth: 75, liquidity: 0.12, label: '-20%', value: '$0.80' },
  { depth: 90, liquidity: 0.05, label: '-50%', value: '$0.50' },
];

export default function OceanDepth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle system for underwater effect
    const particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 400,
        y: Math.random() * 500,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      time += 0.016;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with dark blue gradient (deep ocean)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a1628');
      bgGradient.addColorStop(0.3, '#0d2847');
      bgGradient.addColorStop(0.6, '#0a1f3a');
      bgGradient.addColorStop(1, '#050d1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw water surface waves at top
      ctx.beginPath();
      ctx.moveTo(0, 30);
      for (let x = 0; x <= width; x += 5) {
        const y = 30 + Math.sin(x * 0.02 + time * 2) * 8 + Math.sin(x * 0.01 + time * 1.5) * 5;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();

      // Surface shimmer gradient
      const surfaceGradient = ctx.createLinearGradient(0, 0, 0, 40);
      surfaceGradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      surfaceGradient.addColorStop(1, 'rgba(14, 165, 233, 0.1)');
      ctx.fillStyle = surfaceGradient;
      ctx.fill();

      // Light rays from surface
      for (let i = 0; i < 5; i++) {
        const rayX = (width / 6) * (i + 1);
        const rayWidth = 30 + Math.sin(time + i) * 10;
        const rayGradient = ctx.createLinearGradient(rayX, 0, rayX, height * 0.7);
        rayGradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        rayGradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
        rayGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.beginPath();
        ctx.moveTo(rayX - rayWidth / 2, 30);
        ctx.lineTo(rayX + rayWidth / 2, 30);
        ctx.lineTo(rayX + rayWidth * 2, height * 0.7);
        ctx.lineTo(rayX - rayWidth * 2, height * 0.7);
        ctx.closePath();
        ctx.fillStyle = rayGradient;
        ctx.fill();
      }

      // Draw floating particles (bubbles/plankton)
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(time + p.y * 0.01) * 0.3;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        const depthFactor = 1 - p.y / height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity * (0.3 + depthFactor * 0.7)})`;
        ctx.fill();
      });

      // Draw depth layers with liquidity bars
      const leftMargin = 60;
      const barWidth = width - leftMargin - 40;

      DEPTH_LAYERS.forEach((layer, i) => {
        const y = 50 + (layer.depth / 100) * (height - 100);
        const liquidityWidth = layer.liquidity * barWidth;
        const isHovered = hoveredLayer === i;

        // Depth zone background
        if (i < DEPTH_LAYERS.length - 1) {
          const nextY = 50 + (DEPTH_LAYERS[i + 1].depth / 100) * (height - 100);
          const zoneGradient = ctx.createLinearGradient(leftMargin, y, leftMargin + liquidityWidth, y);
          zoneGradient.addColorStop(0, `rgba(59, 130, 246, ${0.15 + layer.liquidity * 0.15})`);
          zoneGradient.addColorStop(1, `rgba(59, 130, 246, ${0.05})`);
          ctx.fillStyle = zoneGradient;
          ctx.fillRect(leftMargin, y, liquidityWidth, nextY - y);
        }

        // Liquidity bar with wave animation
        const barGradient = ctx.createLinearGradient(leftMargin, 0, leftMargin + liquidityWidth, 0);
        const hue = 200 + layer.liquidity * 40; // Blue to cyan based on liquidity
        const saturation = 70 + layer.liquidity * 30;
        const lightness = 40 + layer.liquidity * 20;
        barGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
        barGradient.addColorStop(0.7, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`);
        barGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`);

        // Animated bar edge
        const waveOffset = Math.sin(time * 2 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(leftMargin, y - 1);
        ctx.lineTo(leftMargin + liquidityWidth + waveOffset, y - 1);
        ctx.lineTo(leftMargin + liquidityWidth + waveOffset, y + 3);
        ctx.lineTo(leftMargin, y + 3);
        ctx.closePath();
        ctx.fillStyle = barGradient;
        ctx.fill();

        // Glow effect on bar
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.5)`;
        ctx.shadowBlur = isHovered ? 15 : 8;
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${isHovered ? 1 : 0.6})`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Depth label on left
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(layer.label, leftMargin - 10, y + 4);

        // Value label on right
        ctx.fillStyle = layer.liquidity > 0.5 ? '#3fb950' : layer.liquidity > 0.2 ? '#f59e0b' : '#ef4444';
        ctx.textAlign = 'left';
        ctx.fillText(layer.value, leftMargin + liquidityWidth + waveOffset + 10, y + 4);

        // Liquidity percentage
        const pct = `${Math.round(layer.liquidity * 100)}%`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pct, leftMargin + liquidityWidth / 2, y + 4);
      });

      // Draw submarine/sonar icon
      const subX = 30;
      const subY = 50 + Math.sin(time) * 10;

      // Sonar ping animation
      const pingRadius = (time * 50) % 150;
      ctx.beginPath();
      ctx.arc(subX, subY, pingRadius, -Math.PI / 4, Math.PI / 4);
      ctx.strokeStyle = `rgba(59, 185, 80, ${Math.max(0, 1 - pingRadius / 150)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Submarine body
      ctx.fillStyle = '#3fb950';
      ctx.beginPath();
      ctx.ellipse(subX, subY, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Periscope
      ctx.fillRect(subX - 2, subY - 15, 4, 10);
      ctx.beginPath();
      ctx.arc(subX, subY - 15, 4, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SCANNING DEPTH...', subX + 25, subY);

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [hoveredLayer]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-[#1e3a5f]/50 shadow-2xl shadow-blue-900/20">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Overlay info */}
      <div className="absolute top-4 left-4 bg-[#0a1628]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#1e3a5f]/50">
        <div className="text-[#38bdf8] text-xs font-medium">AMM LIQUIDITY SONAR</div>
        <div className="text-white text-sm font-bold mt-1">Depth Analysis</div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-[#0a1628]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#1e3a5f]/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#3fb950]" />
            <span className="text-gray-400">Deep</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-gray-400">Shallow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
