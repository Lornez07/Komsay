import * as THREE from 'three';

/**
 * Creates a procedural parquet wood flooring texture
 */
export function createWoodFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base wood warm amber tone
  ctx.fillStyle = '#2b1d14';
  ctx.fillRect(0, 0, 1024, 1024);

  // Parquet herringbone / plank grid
  const plankW = 128;
  const plankH = 32;

  for (let y = 0; y < 1024; y += plankH) {
    const shift = (Math.floor(y / plankH) % 2) * (plankW / 2);
    for (let x = -plankW; x < 1024 + plankW; x += plankW) {
      const px = x + shift;
      // Slight wood shade variations
      const toneVariance = Math.floor(Math.sin(px * 12.3 + y * 7.7) * 15);
      const r = 50 + toneVariance;
      const g = 32 + Math.floor(toneVariance * 0.7);
      const b = 22 + Math.floor(toneVariance * 0.4);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(px + 1, y + 1, plankW - 2, plankH - 2);

      // Wood grain lines
      ctx.strokeStyle = `rgba(15, 8, 4, 0.25)`;
      ctx.lineWidth = 1;
      for (let gline = 0; gline < 4; gline++) {
        const gy = y + 4 + gline * 7;
        ctx.beginPath();
        ctx.moveTo(px, gy);
        ctx.lineTo(px + plankW, gy + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }

      // Plank bevel / seam
      ctx.strokeStyle = '#120b06';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 10);
  return texture;
}

/**
 * Creates subtle bump map for wood planks
 */
export function createWoodBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 16;
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 2;

  for (let y = 0; y < 512; y += plankH) {
    const shift = (Math.floor(y / plankH) % 2) * (plankW / 2);
    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      const px = x + shift;
      ctx.strokeRect(px, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 10);
  return texture;
}

/**
 * Creates subtle museum plaster wall texture
 */
export function createPlasterWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warm off-white / light museum cream gallery color
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle noise grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 3);
  return texture;
}

/**
 * Creates brushed brass texture for title plaques
 */
export function createBrassTexture(name, title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Brushed brass gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 128);
  grad.addColorStop(0, '#cca055');
  grad.addColorStop(0.3, '#edd893');
  grad.addColorStop(0.5, '#ffd97d');
  grad.addColorStop(0.7, '#c99f52');
  grad.addColorStop(1, '#a67c32');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  // Screws on corners
  const drawScrew = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#6b4d1b';
    ctx.fill();
    ctx.strokeStyle = '#ffe49e';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  drawScrew(16, 16);
  drawScrew(512 - 16, 16);
  drawScrew(16, 128 - 16);
  drawScrew(512 - 16, 128 - 16);

  // Border inlay
  ctx.strokeStyle = 'rgba(70, 48, 12, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 512 - 20, 128 - 20);

  // Engraved Name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1c1305';
  ctx.font = 'bold 28px "Playfair Display", "Times New Roman", serif';
  ctx.fillText(name, 256, 50);

  // Role / Subtitle
  ctx.font = 'italic 18px "Cinzel", "Times New Roman", sans-serif';
  ctx.fillStyle = '#3d2b0e';
  ctx.fillText(title || 'Class of 2026', 256, 88);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates an artistic fallback portrait canvas if image is missing or loading
 */
export function createAvatarTexture(name, color = '#6366f1') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Stylish backdrop
  const grad = ctx.createLinearGradient(0, 0, 512, 640);
  grad.addColorStop(0, '#1e2029');
  grad.addColorStop(1, '#0f1117');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 640);

  // Glowing artistic halo
  const halo = ctx.createRadialGradient(256, 260, 40, 256, 260, 200);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(256, 260, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Modern abstract silhouette portrait
  ctx.fillStyle = '#ffffff';
  // Head
  ctx.beginPath();
  ctx.arc(256, 220, 75, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.ellipse(256, 380, 130, 85, 0, 0, Math.PI);
  ctx.fill();

  // Monogram / Initials
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  ctx.fillStyle = color;
  ctx.font = 'bold 44px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 256, 220);

  // Label at bottom
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.fillText(name, 256, 530);

  ctx.font = 'italic 16px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Official Portrait', 256, 565);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
