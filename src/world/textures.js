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
 * Elegant Tech: Dark polished slate floor with subtle cyan circuit grid
 */
export function createTechFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep tech slate base
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle polished reflection gradient
  const sheen = ctx.createLinearGradient(0, 0, 1024, 1024);
  sheen.addColorStop(0, 'rgba(0,212,255,0.04)');
  sheen.addColorStop(0.5, 'transparent');
  sheen.addColorStop(1, 'rgba(212,175,55,0.03)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 1024, 1024);

  // Large tech tiles 256x256 with hairline cyan circuit borders
  const tile = 256;
  ctx.strokeStyle = 'rgba(0,212,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }

  // Inner tile glow + corner nodes
  ctx.strokeStyle = 'rgba(0,212,255,0.12)';
  ctx.lineWidth = 1.2;
  for (let y = 0; y < 1024; y += tile) {
    for (let x = 0; x < 1024; x += tile) {
      // inset frame 16px
      ctx.strokeRect(x + 16, y + 16, tile - 32, tile - 32);
      // corner nodes - small cyan squares
      const nodes = [[x+16,y+16],[x+tile-16,y+16],[x+16,y+tile-16],[x+tile-16,y+tile-16]];
      nodes.forEach(([nx, ny]) => {
        ctx.fillStyle = 'rgba(0,212,255,0.18)';
        ctx.fillRect(nx-3, ny-3, 6, 6);
        ctx.fillStyle = 'rgba(212,175,55,0.12)';
        ctx.fillRect(nx-1.5, ny-1.5, 3, 3);
      });
    }
  }

  // Very subtle binary watermark 0101 scattered
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  ctx.font = '10px monospace';
  for (let i = 0; i < 30; i++) {
    const rx = Math.random()*1024;
    const ry = Math.random()*1024;
    ctx.fillText(Math.random()>0.5 ? '0101' : '1010', rx, ry);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2.5);
  return texture;
}

export function createTechFloorBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = 'rgba(20,20,20,0.9)';
  ctx.lineWidth = 2;
  const tile=128;
  for(let y=0;y<=512;y+=tile){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y); ctx.stroke(); }
  for(let x=0;x<=512;x+=tile){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,512); ctx.stroke(); }
  const t=new THREE.CanvasTexture(canvas);
  t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2.5);
  return t;
}

/**
 * Elegant Tech: Dark slate wall with faint circuit traces and gold-tech accents
 */
export function createCircuitWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep elegant slate
  ctx.fillStyle = '#0e1422';
  ctx.fillRect(0,0,1024,512);

  // Subtle vertical gradient for depth
  const vgrad = ctx.createLinearGradient(0,0,0,512);
  vgrad.addColorStop(0, 'rgba(255,255,255,0.02)');
  vgrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vgrad;
  ctx.fillRect(0,0,1024,512);

  // Faint circuit traces - thin lines with nodes (very subtle for elegance)
  ctx.strokeStyle = 'rgba(0,212,255,0.06)';
  ctx.lineWidth = 1;
  for(let i=0;i<6;i++){
    const y = 40 + i*80 + Math.random()*20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let x=0;
    while(x<1024){
      const seg = 40 + Math.random()*80;
      const ny = y + (Math.random()-0.5)*12;
      ctx.lineTo(x+seg, ny);
      x+=seg;
      // node
      if(Math.random()>0.6){
        ctx.fillStyle='rgba(0,212,255,0.09)';
        ctx.beginPath(); ctx.arc(x, ny, 2.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(212,175,55,0.08)';
        ctx.beginPath(); ctx.arc(x, ny, 1,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.stroke();
  }

  // Horizontal gold hairline at 1/3 and 2/3 for museum elegance
  ctx.strokeStyle='rgba(212,175,55,0.04)';
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,512*0.33); ctx.lineTo(1024,512*0.33); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,512*0.66); ctx.lineTo(1024,512*0.66); ctx.stroke();

  // Ultra-faint binary columns (elegant watermark)
  ctx.fillStyle='rgba(255,255,255,0.012)';
  ctx.font='9px monospace';
  for(let c=0;c<8;c++){
    const cx = c*128 + 40;
    for(let r=0;r<4;r++){
      ctx.fillText(r%2?'011010':'100101', cx, 80 + r*120);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
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
