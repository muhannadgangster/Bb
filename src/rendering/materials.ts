/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Cache generated procedural textures to prevent memory churn
const textureCache: Record<string, THREE.Texture> = {};

export function createAsphaltTexture(): THREE.CanvasTexture {
  if (textureCache['asphalt']) return textureCache['asphalt'] as THREE.CanvasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base asphalt dark charcoal
  ctx.fillStyle = '#1e2124';
  ctx.fillRect(0, 0, 512, 512);

  // Gravel grain noise
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const brightness = Math.random() > 0.5 ? 45 : 20;
    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Double yellow center lines
  ctx.fillStyle = '#ffbe1a';
  ctx.fillRect(250, 0, 4, 512);
  ctx.fillRect(258, 0, 4, 512);

  // White lane dashes
  ctx.fillStyle = '#e2e8f0';
  for (let y = 0; y < 512; y += 48) {
    ctx.fillRect(124, y, 4, 28);
    ctx.fillRect(384, y, 4, 28);
  }

  // Outer solid edge lines
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(16, 0, 4, 512);
  ctx.fillRect(492, 0, 4, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['asphalt'] = texture;
  return texture;
}

export function createSidewalkTexture(): THREE.CanvasTexture {
  if (textureCache['sidewalk']) return textureCache['sidewalk'] as THREE.CanvasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 256, 256);

  // Concrete slabs grid
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 120, 120);
  ctx.strokeRect(132, 4, 120, 120);
  ctx.strokeRect(4, 132, 120, 120);
  ctx.strokeRect(132, 132, 120, 120);

  // Subtle noise
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 90 + Math.random() * 30;
    ctx.fillStyle = `rgba(${v},${v},${v}, 0.15)`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['sidewalk'] = texture;
  return texture;
}

export function createBuildingFacadeTexture(type: 'office' | 'residential' | 'industrial' | 'neon'): THREE.CanvasTexture {
  const key = `building_${type}`;
  if (textureCache[key]) return textureCache[key] as THREE.CanvasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColors = {
    office: '#1e293b',
    residential: '#334155',
    industrial: '#292524',
    neon: '#0f172a'
  };

  ctx.fillStyle = baseColors[type];
  ctx.fillRect(0, 0, 256, 512);

  const rows = type === 'industrial' ? 8 : 20;
  const cols = 8;
  const padX = 256 / cols;
  const padY = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.45;
      const x = c * padX + 4;
      const y = r * padY + 4;
      const w = padX - 8;
      const h = padY - 8;

      if (isLit) {
        if (type === 'neon' && Math.random() > 0.6) {
          const hue = Math.random() > 0.5 ? '#06b6d4' : '#ec4899';
          ctx.fillStyle = hue;
        } else {
          // Warm fluorescent / cool LED office light
          const warm = Math.random() > 0.5;
          ctx.fillStyle = warm ? '#fef08a' : '#bae6fd';
        }
      } else {
        ctx.fillStyle = '#090d16';
      }
      ctx.fillRect(x, y, w, h);

      // Window frame
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = texture;
  return texture;
}

export function createSignTexture(text: string, bgColor: string, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = textColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = textColor;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Materials Library
export const materials = {
  road: new THREE.MeshStandardMaterial({
    map: createAsphaltTexture(),
    roughness: 0.8,
    metalness: 0.1,
  }),
  sidewalk: new THREE.MeshStandardMaterial({
    map: createSidewalkTexture(),
    roughness: 0.9,
    metalness: 0.05,
  }),
  curb: new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.8,
    metalness: 0.05,
  }),
  grass: new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.95,
    metalness: 0.0,
  }),
  sand: new THREE.MeshStandardMaterial({
    color: 0xd4b886,
    roughness: 0.9,
    metalness: 0.0,
  }),
  water: new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x112233,
    roughness: 0.05,
    metalness: 0.9,
    transmission: 0.7,
    transparent: true,
    opacity: 0.7,
  }),
  chrome: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
  }),
  tire: new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.05,
  }),
  headlight: new THREE.MeshBasicMaterial({
    color: 0xffffff,
  }),
  taillight: new THREE.MeshBasicMaterial({
    color: 0xff1e1e,
  }),
  copBlue: new THREE.MeshBasicMaterial({
    color: 0x0066ff,
  }),
  copRed: new THREE.MeshBasicMaterial({
    color: 0xff0022,
  }),
};
