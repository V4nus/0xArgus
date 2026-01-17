// Web Worker for generating ocean textures off the main thread

// Noise functions for texture generation
const noise = (x: number, y: number, seed: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
};

const smoothNoise = (x: number, y: number, scale: number, seed: number) => {
  const i = Math.floor(x * scale);
  const j = Math.floor(y * scale);
  const fx = x * scale - i;
  const fy = y * scale - j;

  const a = noise(i, j, seed);
  const b = noise(i + 1, j, seed);
  const c = noise(i, j + 1, seed);
  const d = noise(i + 1, j + 1, seed);

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
};

// Generate normal map texture data
function generateNormalMap(size: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  const delta = 1 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      // Calculate height differences for normal calculation
      const hL = smoothNoise(u - delta, v, 8, 0) * 0.5 + smoothNoise(u - delta, v, 16, 1) * 0.25;
      const hR = smoothNoise(u + delta, v, 8, 0) * 0.5 + smoothNoise(u + delta, v, 16, 1) * 0.25;
      const hD = smoothNoise(u, v - delta, 8, 0) * 0.5 + smoothNoise(u, v - delta, 16, 1) * 0.25;
      const hU = smoothNoise(u, v + delta, 8, 0) * 0.5 + smoothNoise(u, v + delta, 16, 1) * 0.25;

      const nx = (hL - hR) * 2;
      const ny = (hD - hU) * 2;
      const nz = 1;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * size + x) * 4;
      data[idx] = ((nx / len) * 0.5 + 0.5) * 255;
      data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[idx + 3] = 255;
    }
  }

  return data;
}

// Generate foam texture data
function generateFoamTexture(size: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      let foam = 0;
      foam += smoothNoise(u, v, 12, 10) * 0.4;
      foam += smoothNoise(u, v, 24, 11) * 0.3;
      foam += smoothNoise(u, v, 48, 12) * 0.2;
      foam += smoothNoise(u, v, 96, 13) * 0.1;

      foam = Math.pow(foam, 1.5);
      foam = foam > 0.35 ? 1.0 : 0.0;

      const idx = (y * size + x) * 4;
      data[idx] = foam * 255;
      data[idx + 1] = foam * 255;
      data[idx + 2] = foam * 255;
      data[idx + 3] = 255;
    }
  }

  return data;
}

// Worker message types
export interface TextureWorkerRequest {
  type: 'generateNormalMap' | 'generateFoamTexture';
  size: number;
}

export interface TextureWorkerResponse {
  type: 'normalMap' | 'foamTexture';
  data: Uint8ClampedArray;
  size: number;
}

// Worker code as string (for inline worker creation)
export const textureWorkerCode = `
const noise = (x, y, seed) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
};

const smoothNoise = (x, y, scale, seed) => {
  const i = Math.floor(x * scale);
  const j = Math.floor(y * scale);
  const fx = x * scale - i;
  const fy = y * scale - j;

  const a = noise(i, j, seed);
  const b = noise(i + 1, j, seed);
  const c = noise(i, j + 1, seed);
  const d = noise(i + 1, j + 1, seed);

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
};

function generateNormalMap(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const delta = 1 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      const hL = smoothNoise(u - delta, v, 8, 0) * 0.5 + smoothNoise(u - delta, v, 16, 1) * 0.25;
      const hR = smoothNoise(u + delta, v, 8, 0) * 0.5 + smoothNoise(u + delta, v, 16, 1) * 0.25;
      const hD = smoothNoise(u, v - delta, 8, 0) * 0.5 + smoothNoise(u, v - delta, 16, 1) * 0.25;
      const hU = smoothNoise(u, v + delta, 8, 0) * 0.5 + smoothNoise(u, v + delta, 16, 1) * 0.25;

      const nx = (hL - hR) * 2;
      const ny = (hD - hU) * 2;
      const nz = 1;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * size + x) * 4;
      data[idx] = ((nx / len) * 0.5 + 0.5) * 255;
      data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[idx + 3] = 255;
    }
  }

  return data;
}

function generateFoamTexture(size) {
  const data = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      let foam = 0;
      foam += smoothNoise(u, v, 12, 10) * 0.4;
      foam += smoothNoise(u, v, 24, 11) * 0.3;
      foam += smoothNoise(u, v, 48, 12) * 0.2;
      foam += smoothNoise(u, v, 96, 13) * 0.1;

      foam = Math.pow(foam, 1.5);
      foam = foam > 0.35 ? 1.0 : 0.0;

      const idx = (y * size + x) * 4;
      data[idx] = foam * 255;
      data[idx + 1] = foam * 255;
      data[idx + 2] = foam * 255;
      data[idx + 3] = 255;
    }
  }

  return data;
}

self.onmessage = function(e) {
  const { type, size } = e.data;

  if (type === 'generateNormalMap') {
    const data = generateNormalMap(size);
    self.postMessage({ type: 'normalMap', data, size }, [data.buffer]);
  } else if (type === 'generateFoamTexture') {
    const data = generateFoamTexture(size);
    self.postMessage({ type: 'foamTexture', data, size }, [data.buffer]);
  }
};
`;

// Create inline worker from code string
export function createTextureWorker(): Worker | null {
  if (typeof window === 'undefined') return null;

  try {
    const blob = new Blob([textureWorkerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    // Clean up blob URL after worker is created
    URL.revokeObjectURL(url);

    return worker;
  } catch {
    console.warn('Web Worker not supported, falling back to main thread');
    return null;
  }
}

// Fallback functions for environments without Worker support
export { generateNormalMap, generateFoamTexture };
