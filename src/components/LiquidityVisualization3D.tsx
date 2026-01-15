'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// Generate liquidity data for visualization
function generateLiquidityData() {
  const data: { price: number; liquidity: number; side: 'bid' | 'ask' }[] = [];
  const centerPrice = 2847;

  // Bids (left side, green)
  for (let i = 1; i <= 15; i++) {
    const price = centerPrice - i * 15;
    const distance = i;
    const liquidity = 800000 * Math.exp(-distance * 0.12) * (0.5 + Math.random() * 0.8);
    data.push({ price, liquidity, side: 'bid' });
  }

  // Asks (right side, red)
  for (let i = 1; i <= 15; i++) {
    const price = centerPrice + i * 15;
    const distance = i;
    const liquidity = 800000 * Math.exp(-distance * 0.12) * (0.5 + Math.random() * 0.8);
    data.push({ price, liquidity, side: 'ask' });
  }

  return data;
}

// Single liquidity bar component
function LiquidityBar({
  position,
  height,
  color,
  delay,
  isHovered,
  onHover,
  onUnhover,
  index,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  delay: number;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentHeight, setCurrentHeight] = useState(0);
  const targetHeight = useRef(height);

  useEffect(() => {
    targetHeight.current = height;
  }, [height]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Animate height with delay
    const time = state.clock.getElapsedTime();
    if (time > delay) {
      setCurrentHeight((prev) => {
        const diff = targetHeight.current - prev;
        return prev + diff * 0.08;
      });
    }

    // Subtle wave animation
    const wave = Math.sin(state.clock.getElapsedTime() * 2 + index * 0.3) * 0.02;
    meshRef.current.scale.y = 1 + wave;

    // Hover effect
    if (isHovered) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1.2, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1.2, 0.1);
    } else {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], currentHeight / 2, position[2]]}
      onPointerOver={onHover}
      onPointerOut={onUnhover}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.4, currentHeight, 0.4]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={isHovered ? 0.95 : 0.8}
        emissive={color}
        emissiveIntensity={isHovered ? 0.4 : 0.15}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

// Particle system for ambient effect
function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.01;
      if (positions[i * 3 + 1] > 8) {
        positions[i * 3 + 1] = 0;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#22c55e"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Grid floor
function Grid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[20, 12]} />
      <meshStandardMaterial
        color="#0a0a0a"
        transparent
        opacity={0.8}
        metalness={0.5}
        roughness={0.8}
      />
    </mesh>
  );
}

// Price axis labels
function PriceLabels() {
  return (
    <>
      <Text
        position={[-7, -0.5, 2]}
        fontSize={0.3}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
      >
        BIDS
      </Text>
      <Text
        position={[7, -0.5, 2]}
        fontSize={0.3}
        color="#ef4444"
        anchorX="center"
        anchorY="middle"
      >
        ASKS
      </Text>
      <Text
        position={[0, -0.5, 2]}
        fontSize={0.25}
        color="#888"
        anchorX="center"
        anchorY="middle"
      >
        $2,847
      </Text>
    </>
  );
}

// Main 3D scene
function Scene() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [liquidityData, setLiquidityData] = useState(generateLiquidityData);

  // Update data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLiquidityData(generateLiquidityData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const maxLiquidity = Math.max(...liquidityData.map((d) => d.liquidity));

  // Sort data: bids from right to left (high price to low), asks from left to right (low price to high)
  const sortedBids = liquidityData
    .filter((d) => d.side === 'bid')
    .sort((a, b) => b.price - a.price);
  const sortedAsks = liquidityData
    .filter((d) => d.side === 'ask')
    .sort((a, b) => a.price - b.price);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 6, 12]} fov={50} />

      {/* Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={8}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.3}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#22c55e" />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#ef4444" />

      {/* Grid floor */}
      <Grid />

      {/* Bids (left side, green) */}
      {sortedBids.map((data, i) => {
        const height = (data.liquidity / maxLiquidity) * 5;
        const xPos = -0.5 - i * 0.5;
        return (
          <LiquidityBar
            key={`bid-${i}`}
            position={[xPos, 0, 0]}
            height={height}
            color="#22c55e"
            delay={i * 0.05}
            isHovered={hoveredIndex === i}
            onHover={() => setHoveredIndex(i)}
            onUnhover={() => setHoveredIndex(null)}
            index={i}
          />
        );
      })}

      {/* Asks (right side, red) */}
      {sortedAsks.map((data, i) => {
        const height = (data.liquidity / maxLiquidity) * 5;
        const xPos = 0.5 + i * 0.5;
        return (
          <LiquidityBar
            key={`ask-${i}`}
            position={[xPos, 0, 0]}
            height={height}
            color="#ef4444"
            delay={i * 0.05}
            isHovered={hoveredIndex === i + 15}
            onHover={() => setHoveredIndex(i + 15)}
            onUnhover={() => setHoveredIndex(null)}
            index={i + 15}
          />
        );
      })}

      {/* Center price marker */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.8}
          />
        </mesh>
      </Float>

      {/* Particles */}
      <Particles />

      {/* Labels */}
      <PriceLabels />

      {/* Fog for depth */}
      <fog attach="fog" args={['#000', 10, 25]} />
    </>
  );
}

// Main component wrapper
export default function LiquidityVisualization3D() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[500px] bg-black flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading 3D visualization...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden relative">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>

      {/* Overlay gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          Drag to rotate · Scroll to zoom
        </span>
      </div>
    </div>
  );
}
