'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle system
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities: THREE.Vector3[] = [];

    // Initialize particles in a sphere distribution
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 30 + Math.random() * 40;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Green color with slight variation
      const greenIntensity = 0.5 + Math.random() * 0.5;
      colors[i3] = 0.1 + Math.random() * 0.15; // R
      colors[i3 + 1] = greenIntensity; // G
      colors[i3 + 2] = 0.1 + Math.random() * 0.2; // B

      sizes[i] = Math.random() * 2 + 0.5;

      // Velocity for each particle
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        uniform float pixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Pulsing alpha based on position and time
          vAlpha = 0.4 + 0.6 * sin(time * 2.0 + position.x * 0.1);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Create circular particle with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;

          // Soft glow effect
          float alpha = vAlpha * (1.0 - dist * 2.0);
          alpha = pow(alpha, 1.5);

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connection lines between nearby particles
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * 6); // Max 1 connection per particle
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3fb950,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.01;
      material.uniforms.time.value = time;

      // Update particle positions
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
      const positionArray = positionAttribute.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positionArray[i3] += velocities[i].x;
        positionArray[i3 + 1] += velocities[i].y;
        positionArray[i3 + 2] += velocities[i].z;

        // Contain particles in sphere
        const dist = Math.sqrt(
          positionArray[i3] ** 2 +
          positionArray[i3 + 1] ** 2 +
          positionArray[i3 + 2] ** 2
        );

        if (dist > 70 || dist < 20) {
          velocities[i].multiplyScalar(-1);
        }
      }
      positionAttribute.needsUpdate = true;

      // Update connection lines
      const linePositionArray = lineGeometry.getAttribute('position').array as Float32Array;
      let lineIndex = 0;
      const connectionThreshold = 15;

      for (let i = 0; i < Math.min(particleCount, 200); i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < Math.min(particleCount, 200); j++) {
          const j3 = j * 3;
          const dx = positionArray[i3] - positionArray[j3];
          const dy = positionArray[i3 + 1] - positionArray[j3 + 1];
          const dz = positionArray[i3 + 2] - positionArray[j3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionThreshold && lineIndex < linePositions.length - 6) {
            linePositionArray[lineIndex++] = positionArray[i3];
            linePositionArray[lineIndex++] = positionArray[i3 + 1];
            linePositionArray[lineIndex++] = positionArray[i3 + 2];
            linePositionArray[lineIndex++] = positionArray[j3];
            linePositionArray[lineIndex++] = positionArray[j3 + 1];
            linePositionArray[lineIndex++] = positionArray[j3 + 2];
          }
        }
      }

      // Clear remaining line positions
      for (let i = lineIndex; i < linePositionArray.length; i++) {
        linePositionArray[i] = 0;
      }
      lineGeometry.getAttribute('position').needsUpdate = true;

      // Rotate based on mouse position
      particles.rotation.y += 0.001;
      particles.rotation.y += mouseRef.current.x * 0.002;
      particles.rotation.x += mouseRef.current.y * 0.001;

      lines.rotation.y = particles.rotation.y;
      lines.rotation.x = particles.rotation.x;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #0a1a0f 0%, #000000 100%)' }}
    />
  );
}
