import { museumConfig } from '../data/classmates.js';

export class Minimap {
  constructor(container, classmates, onClassmateClick) {
    this.container = container;
    this.classmates = classmates;
    this.onClassmateClick = onClassmateClick;

    this.roomW = museumConfig.roomDimensions.width;
    this.roomL = museumConfig.roomDimensions.length;

    this.mapW = 160;
    this.mapH = 200;

    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'minimap-container';
    this.element.innerHTML = `
      <div class="minimap-header" id="minimap-toggle-btn" title="Toggle Map">
        <span>MUSEUM MAP</span>
        <span class="minimap-arrow" id="minimap-arrow">▼</span>
      </div>
      <div class="minimap-content" id="minimap-content">
        <canvas id="minimap-canvas" width="${this.mapW}" height="${this.mapH}"></canvas>
        <div class="minimap-legend">
          <span class="legend-player">● You</span>
          <span class="legend-art">■ Portraits</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.canvas = this.element.querySelector('#minimap-canvas');
    this.ctx = this.canvas.getContext('2d');

    const toggleBtn = this.element.querySelector('#minimap-toggle-btn');
    const arrow = this.element.querySelector('#minimap-arrow');
    toggleBtn.addEventListener('click', () => {
      this.element.classList.toggle('collapsed');
      const isCollapsed = this.element.classList.contains('collapsed');
      arrow.textContent = isCollapsed ? '▲' : '▼';
    });

    this.canvas.addEventListener('click', (e) => this.handleMapClick(e));
  }

  // Convert 3D scene (X, Z) to 2D canvas coordinates
  worldToMap(wx, wz) {
    const pad = 18;
    const innerW = this.mapW - pad * 2;
    const innerH = this.mapH - pad * 2;

    const mx = pad + ((wx + this.roomW / 2) / this.roomW) * innerW;
    const my = pad + ((wz + this.roomL / 2) / this.roomL) * innerH;
    return { x: mx, y: my };
  }

  // Convert 2D canvas coordinates to 3D scene (X, Z)
  mapToWorld(mx, my) {
    const pad = 18;
    const innerW = this.mapW - pad * 2;
    const innerH = this.mapH - pad * 2;

    const wx = ((mx - pad) / innerW) * this.roomW - this.roomW / 2;
    const wz = ((my - pad) / innerH) * this.roomL - this.roomL / 2;
    return { x: wx, z: wz };
  }

  handleMapClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near any classmate pin
    let closest = null;
    let closestDist = 18; // px tolerance

    this.classmates.forEach(c => {
      // Find classmate approximate world pos
      let wx = 0, wz = 0;
      if (c.wall === 'north') { wx = 0; wz = -this.roomL / 2; }
      else if (c.wall === 'south') { wx = 0; wz = this.roomL / 2; }
      else if (c.wall === 'east') { wx = this.roomW / 2; wz = 0; }
      else if (c.wall === 'west') { wx = -this.roomW / 2; wz = 0; }

      // We can get actual positions when rendered or by wall
      const mPos = this.worldToMap(c.calculatedX || wx, c.calculatedZ || wz);
      const dist = Math.hypot(clickX - mPos.x, clickY - mPos.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = c;
      }
    });

    if (closest && this.onClassmateClick) {
      this.onClassmateClick(closest);
    }
  }

  update(playerPos, playerRotationY, framePositions) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.mapW, this.mapH);

    // Map background
    ctx.fillStyle = '#141720';
    ctx.fillRect(0, 0, this.mapW, this.mapH);

    const pad = 18;
    const innerW = this.mapW - pad * 2;
    const innerH = this.mapH - pad * 2;

    // Museum Floor outline
    ctx.fillStyle = '#222734';
    ctx.fillRect(pad, pad, innerW, innerH);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, innerW, innerH);

    // Wall cardinal labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', this.mapW / 2, 9);
    ctx.fillText('S', this.mapW / 2, this.mapH - 9);
    ctx.fillText('W', 9, this.mapH / 2);
    ctx.fillText('E', this.mapW - 9, this.mapH / 2);

    // Benches in center
    const bench1 = this.worldToMap(0, -4);
    const bench2 = this.worldToMap(0, 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(bench1.x - 10, bench1.y - 4, 20, 8);
    ctx.fillRect(bench2.x - 10, bench2.y - 4, 20, 8);

    // Classmate frame pins
    if (framePositions && framePositions.length > 0) {
      framePositions.forEach(fp => {
        fp.classmate.calculatedX = fp.position.x;
        fp.classmate.calculatedZ = fp.position.z;

        const mPos = this.worldToMap(fp.position.x, fp.position.z);
        ctx.fillStyle = '#d4af37'; // Gold
        ctx.fillRect(mPos.x - 2.5, mPos.y - 2.5, 5, 5);
      });
    }

    // Player position and viewing cone
    if (playerPos) {
      const p = this.worldToMap(playerPos.x, playerPos.z);

      // Vision cone
      const coneLength = 22;
      const angle = -playerRotationY - Math.PI / 2; // adjust angle for 2D canvas
      const fov = 0.55;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, coneLength, angle - fov, angle + fov);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();

      // Player circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
