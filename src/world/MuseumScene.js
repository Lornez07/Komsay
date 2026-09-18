import * as THREE from 'three';
import {
  createWoodFloorTexture,
  createWoodBumpTexture,
  createTechFloorTexture,
  createTechFloorBumpTexture,
  createCircuitWallTexture,
  createBrassTexture,
  createAvatarTexture
} from './textures.js';
import { classmates, museumConfig } from '../data/classmates.js';

export class MuseumScene {
  constructor(canvasContainer, onSelectClassmate) {
    this.container = canvasContainer;
    this.onSelectClassmate = onSelectClassmate;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#070a14');
    this.scene.fog = new THREE.Fog('#070a14', 28, 52);

    this.width = museumConfig.roomDimensions.width;
    this.length = museumConfig.roomDimensions.length;
    this.height = museumConfig.roomDimensions.height;

    this.interactableFrames = [];
    this.hoveredFrame = null;
    this.textureLoader = new THREE.TextureLoader();

    this.initRenderer();
    this.initCamera();
    this.buildRoom();
    this.buildLighting();
    this.buildClassmateFrames();
    this.buildDecorations();
    this.initRaycaster();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 100);
    // Stand in the center-south looking directly north at the main graduation wall
    this.camera.position.set(0, 1.8, 8);
    this.camera.lookAt(0, 2.2, -this.length / 2);
  }

  buildRoom() {
    const { width, length, height } = this;

    // 1. Tech Floor - dark polished slate with cyan circuit grid (elegant)
    const floorTex = createTechFloorTexture();
    const bumpTex = createTechFloorBumpTexture();
    floorTex.anisotropy = this.maxAnisotropy;
    bumpTex.anisotropy = this.maxAnisotropy;
    floorTex.minFilter = THREE.LinearMipmapLinearFilter;
    bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: bumpTex,
      bumpScale: 0.02,
      roughness: 0.28,
      metalness: 0.45,
      emissive: 0x001122,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // 2. Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(width, length);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = height;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 3. Central Architectural Skylight
    const skylightGeo = new THREE.PlaneGeometry(width * 0.5, length * 0.5);
    const skylightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const skylight = new THREE.Mesh(skylightGeo, skylightMat);
    skylight.position.set(0, height - 0.01, 0);
    skylight.rotation.x = Math.PI / 2;
    this.scene.add(skylight);

    // Skylight decorative beams
    const grid = new THREE.GridHelper(Math.max(width * 0.5, length * 0.5), 8, 0x111620, 0x242d3d);
    grid.position.set(0, height - 0.02, 0);
    this.scene.add(grid);

    // 4. Museum Walls - elegant dark slate with faint circuit traces (CS/IT tech)
    const wallTex = createCircuitWallTexture();
    wallTex.anisotropy = this.maxAnisotropy;
    wallTex.minFilter = THREE.LinearMipmapLinearFilter;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x001a33,
      emissiveIntensity: 0.07,
      side: THREE.DoubleSide
    });

    // North Wall (Z = -length/2)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
    northWall.position.set(0, height / 2, -length / 2);
    this.scene.add(northWall);

    // South Wall (Z = length/2)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
    southWall.position.set(0, height / 2, length / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // East Wall (X = width/2)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMat);
    eastWall.position.set(width / 2, height / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // West Wall (X = -width/2)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMat);
    westWall.position.set(-width / 2, height / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // 5. Elegant Tech Baseboard - brushed dark aluminum + cyan neon hairline
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.7 });
    const trimH = 0.28;
    const trimD = 0.1;

    const trimNS = new THREE.BoxGeometry(width, trimH, trimD);
    const nTrim = new THREE.Mesh(trimNS, trimMat);
    nTrim.position.set(0, trimH / 2, -length / 2 + trimD / 2);
    this.scene.add(nTrim);

    const sTrim = new THREE.Mesh(trimNS, trimMat);
    sTrim.position.set(0, trimH / 2, length / 2 - trimD / 2);
    this.scene.add(sTrim);

    const trimEW = new THREE.BoxGeometry(trimD, trimH, length);
    const eTrim = new THREE.Mesh(trimEW, trimMat);
    eTrim.position.set(width / 2 - trimD / 2, trimH / 2, 0);
    this.scene.add(eTrim);

    const wTrim = new THREE.Mesh(trimEW, trimMat);
    wTrim.position.set(-width / 2 + trimD / 2, trimH / 2, 0);
    this.scene.add(wTrim);

    // 5b. Cyan neon hairline on top of baseboard (elegant tech accent)
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const addNeonStrip = (geo, x, y, z) => {
      const strip = new THREE.Mesh(geo, neonMat);
      strip.position.set(x, y, z);
      this.scene.add(strip);
    };
    const neonH = 0.015;
    const neonD = 0.012;
    addNeonStrip(new THREE.BoxGeometry(width - 0.2, neonH, neonD), 0, trimH + neonH/2, -length/2 + trimD/2 + 0.02);
    addNeonStrip(new THREE.BoxGeometry(width - 0.2, neonH, neonD), 0, trimH + neonH/2, length/2 - trimD/2 - 0.02);
    addNeonStrip(new THREE.BoxGeometry(neonD, neonH, length - 0.2), width/2 - trimD/2 - 0.02, trimH + neonH/2, 0);
    addNeonStrip(new THREE.BoxGeometry(neonD, neonH, length - 0.2), -width/2 + trimD/2 + 0.02, trimH + neonH/2, 0);

    // 5c. Ceiling recessed tech light ring under skylight
    const ringGeo = new THREE.RingGeometry(width*0.22, width*0.23, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI/2;
    ring.position.set(0, height - 0.04, 0);
    this.scene.add(ring);

    // 5d. Elegant Chandelier - CS centerpiece (gold + cyan tech)
    this.buildChandelier();

    // 6. Grand Graduation Wall Banner on North Wall
    this.buildHonorBanner();
  }

  buildHonorBanner() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Elegant tech gradient - deep navy to slate with cyan underglow
    const grad = ctx.createLinearGradient(0, 0, 2048, 256);
    grad.addColorStop(0, '#070a14');
    grad.addColorStop(0.3, '#0f1e2e');
    grad.addColorStop(0.7, '#0f1e2e');
    grad.addColorStop(1, '#070a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 256);

    // Outer gold border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 2048 - 32, 256 - 32);
    // Inner cyan tech hairline
    ctx.strokeStyle = 'rgba(0,212,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, 2048 - 44, 256 - 44);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top subtitle - CS only
    ctx.fillStyle = '#00d4ff';
    ctx.font = '600 28px "JetBrains Mono", "Consolas", monospace';
    ctx.fillText('<  DEPARTMENT OF COMPUTER SCIENCE  />   •   CLASS OF 2026', 1024, 70);

    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 62px "Playfair Display", serif';
    ctx.fillText('HALL  OF  CODE', 1024, 145);
    // Gold underline accent
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(880, 172, 288, 2);

    // Subtext
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px "Inter", sans-serif';
    ctx.fillText('10 Builders  •  Coders  •  Innovators  —  Forever Batch 2026', 1024, 210);
    // Small tech tag on right
    ctx.fillStyle = 'rgba(0,212,255,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('01001000 01000001 01001100 01001100', 2030, 242);

    const texture = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 1.6), bannerMat);
    bannerMesh.position.set(0, this.height - 0.95, -this.length / 2 + 0.08);
    this.scene.add(bannerMesh);
  }

  buildChandelier() {
    const { height } = this;
    const chandelier = new THREE.Group();
    chandelier.position.set(0, height, 0);

    // Ceiling mount - brushed gold disc
    const mountGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const mount = new THREE.Mesh(mountGeo, goldMat);
    mount.position.y = -0.02;
    chandelier.add(mount);

    // Cyan emissive ring on mount
    const mountRingGeo = new THREE.RingGeometry(0.26, 0.30, 24);
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.0 });
    const mountRing = new THREE.Mesh(mountRingGeo, cyanMat);
    mountRing.rotation.x = -Math.PI/2;
    mountRing.position.y = -0.055;
    chandelier.add(mountRing);

    // Central rod - dark aluminum + cyan core
    const rodGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.35, 12);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, metalness: 0.7, roughness: 0.3 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.y = -0.75;
    chandelier.add(rod);

    const coreGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.30, 8);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.5 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -0.75;
    chandelier.add(core);

    // Tier 1 - main gold ring (large)
    const tier1Y = -1.25;
    const tier1Radius = 1.15;
    const tier1TorusGeo = new THREE.TorusGeometry(tier1Radius, 0.022, 12, 48);
    const tier1 = new THREE.Mesh(tier1TorusGeo, goldMat);
    tier1.rotation.x = Math.PI/2;
    tier1.position.y = tier1Y;
    chandelier.add(tier1);

    // Tier 2 - inner cyan ring (smaller)
    const tier2Y = -1.65;
    const tier2Radius = 0.72;
    const tier2TorusGeo = new THREE.TorusGeometry(tier2Radius, 0.015, 12, 36);
    const tier2Mat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.9, metalness: 0.6 });
    const tier2 = new THREE.Mesh(tier2TorusGeo, tier2Mat);
    tier2.rotation.x = Math.PI/2;
    tier2.position.y = tier2Y;
    chandelier.add(tier2);

    // Spokes from rod to tier1 (8 arms)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spokeLen = tier1Radius;
      const spokeGeo = new THREE.CylinderGeometry(0.01, 0.01, spokeLen, 6);
      const spoke = new THREE.Mesh(spokeGeo, goldMat);
      spoke.position.set(Math.cos(angle) * spokeLen/2, tier1Y, Math.sin(angle) * spokeLen/2);
      spoke.rotation.z = Math.PI/2;
      spoke.rotation.y = -angle;
      chandelier.add(spoke);
    }

    // Hanging crystals - Tier1 (8 gold+cyan teardrops)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * tier1Radius;
      const z = Math.sin(angle) * tier1Radius;
      const h = 0.22 + Math.random()*0.08;
      // gold cap
      const capGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.04, 8);
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.set(x, tier1Y - 0.02, z);
      chandelier.add(cap);
      // crystal - cone hanging
      const crystGeo = new THREE.ConeGeometry(0.07, h, 6);
      const crystMat = new THREE.MeshStandardMaterial({
        color: 0xe0f7ff,
        transparent: true,
        opacity: 0.88,
        roughness: 0.08,
        metalness: 0.15,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.18
      });
      const cryst = new THREE.Mesh(crystGeo, crystMat);
      cryst.position.set(x, tier1Y - 0.06 - h/2, z);
      cryst.rotation.x = Math.PI;
      chandelier.add(cryst);
    }

    // Hanging crystals - Tier2 (6 smaller)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.PI/12;
      const x = Math.cos(angle) * tier2Radius;
      const z = Math.sin(angle) * tier2Radius;
      const h = 0.16;
      const crystGeo = new THREE.ConeGeometry(0.05, h, 6);
      const crystMat = new THREE.MeshStandardMaterial({
        color: 0xfff8e0,
        transparent: true,
        opacity: 0.85,
        roughness: 0.12,
        metalness: 0.2,
        emissive: 0xd4af37,
        emissiveIntensity: 0.12
      });
      const cryst = new THREE.Mesh(crystGeo, crystMat);
      cryst.position.set(x, tier2Y - 0.02 - h/2, z);
      cryst.rotation.x = Math.PI;
      chandelier.add(cryst);
    }

    // Central hanging gem (below tier2)
    const centerGemGeo = new THREE.OctahedronGeometry(0.14, 0);
    const centerGemMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.92,
      metalness: 0.3,
      roughness: 0.1
    });
    const centerGem = new THREE.Mesh(centerGemGeo, centerGemMat);
    centerGem.position.y = tier2Y - 0.38;
    chandelier.add(centerGem);
    this.chandelierGem = centerGem;

    // Central point light - warm + cyan mix for elegant glow
    const chandLight = new THREE.PointLight(0xfff4cc, 1.4, 14, 1.8);
    chandLight.position.set(0, -1.45, 0);
    chandelier.add(chandLight);
    const chandCyan = new THREE.PointLight(0x00d4ff, 0.75, 10, 2);
    chandCyan.position.set(0, -1.65, 0);
    chandelier.add(chandCyan);

    this.scene.add(chandelier);
    this.chandelier = chandelier;
  }

  buildLighting() {
    // 1. Soft ambient + tech fog
    const ambientLight = new THREE.AmbientLight(0xccd6e8, 0.75);
    this.scene.add(ambientLight);

    // 2. Hemisphere - cool tech tint
    const hemiLight = new THREE.HemisphereLight(0xe0f2ff, 0x0a0f1e, 0.65);
    this.scene.add(hemiLight);

    // 3. Directional skylight - cooler
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
    sunLight.position.set(0, this.height - 0.5, 0);
    this.scene.add(sunLight);

    // 4. Wall-facing fills - slightly cyan for tech elegance
    const makeWallFill = (x, y, z, targetX, targetZ) => {
      const light = new THREE.DirectionalLight(0xe6f7ff, 0.42);
      light.position.set(x, y, z);
      light.target.position.set(targetX, y, targetZ);
      this.scene.add(light);
      this.scene.add(light.target);
    };
    makeWallFill(0, 3.5, 0, 0, -this.length / 2);
    makeWallFill(0, 3.5, 0, 0, this.length / 2);
    makeWallFill(0, 3.5, 0, this.width / 2, 0);
    makeWallFill(0, 3.5, 0, -this.width / 2, 0);

    // 5. Elegant tech accent - cyan point lights near baseboard corners
    const accentColor = 0x00d4ff;
    const addAccent = (x, z) => {
      const p = new THREE.PointLight(accentColor, 1.1, 7, 2);
      p.position.set(x, 0.22, z);
      this.scene.add(p);
    };
    const cx = this.width/2 - 1.2, cz = this.length/2 - 1.2;
    addAccent(-cx, -cz); addAccent(cx, -cz); addAccent(-cx, cz); addAccent(cx, cz);
    // Gold warm points under banner for elegance
    const goldAccent = new THREE.PointLight(0xd4af37, 0.8, 6, 2);
    goldAccent.position.set(0, 3.2, -this.length/2 + 1.2);
    this.scene.add(goldAccent);
  }

  buildClassmateFrames() {
    const { width, length } = this;
    const eyeLevel = 2.4;
    const frameW = 2.2;
    const frameH = 2.8;

    const wallGroups = {
      north: classmates.filter(c => c.wall === 'north'), // 4 graduates
      east: classmates.filter(c => c.wall === 'east'),   // 3 graduates
      west: classmates.filter(c => c.wall === 'west'),   // 3 graduates
      south: classmates.filter(c => c.wall === 'south')
    };

    const layoutWall = (items, wallSpan, wallType) => {
      const count = items.length;
      if (count === 0) return;
      const margin = 4.0;
      const usableSpan = wallSpan - margin * 2;
      const step = count > 1 ? usableSpan / (count - 1) : 0;
      const start = -usableSpan / 2;

      items.forEach((classmate, index) => {
        const offset = count > 1 ? start + index * step : 0;
        let pos = new THREE.Vector3();
        let rotY = 0;
        let normal = new THREE.Vector3();

        if (wallType === 'north') {
          pos.set(offset, eyeLevel, -length / 2 + 0.12);
          rotY = 0;
          normal.set(0, 0, 1);
        } else if (wallType === 'east') {
          pos.set(width / 2 - 0.12, eyeLevel, offset);
          rotY = -Math.PI / 2;
          normal.set(-1, 0, 0);
        } else if (wallType === 'west') {
          pos.set(-width / 2 + 0.12, eyeLevel, -offset);
          rotY = Math.PI / 2;
          normal.set(1, 0, 0);
        } else if (wallType === 'south') {
          pos.set(-offset, eyeLevel, length / 2 - 0.12);
          rotY = Math.PI;
          normal.set(0, 0, -1);
        }

        this.createFrameObject(classmate, pos, rotY, normal, frameW, frameH);
      });
    };

    layoutWall(wallGroups.north, width, 'north');
    layoutWall(wallGroups.east, length, 'east');
    layoutWall(wallGroups.west, length, 'west');
  }

  createFrameObject(classmate, position, rotY, normal, frameW, frameH) {
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(position);
    frameGroup.rotation.y = rotY;

    // 1. Outer Luxurious Gold Beveled Frame
    const border = 0.16;
    const depth = 0.1;
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.8,
      roughness: 0.28
    });

    const frameOuter = new THREE.Mesh(
      new THREE.BoxGeometry(frameW + border * 2, frameH + border * 2, depth),
      outerMat
    );
    frameGroup.add(frameOuter);

    // 2. White Gallery Passe-partout Matting - use Plane to avoid thin-box edge aliasing
    const mattingMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    const matting = new THREE.Mesh(
      new THREE.PlaneGeometry(frameW, frameH),
      mattingMat
    );
    matting.position.z = depth / 2 + 0.001;
    frameGroup.add(matting);

    // 3. Classmate Portrait Mesh
    const photoW = frameW - 0.22;
    const photoH = frameH - 0.22;

    const avatarTex = createAvatarTexture(classmate.name, classmate.color);
    avatarTex.anisotropy = this.maxAnisotropy;
    avatarTex.minFilter = THREE.LinearMipmapLinearFilter;
    const fallbackMat = new THREE.MeshBasicMaterial({
      map: avatarTex
    });
    const portraitMat = fallbackMat;

    if (classmate.image) {
      this.textureLoader.load(
        classmate.image,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          loadedTex.anisotropy = this.maxAnisotropy;
          loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTex.generateMipmaps = true;
          portraitMat.map = loadedTex;
          portraitMat.needsUpdate = true;
        },
        undefined,
        () => {
          console.log(`Using custom avatar for ${classmate.name}`);
        }
      );
    }

    const portraitMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(photoW, photoH),
      portraitMat
    );
    portraitMesh.position.z = depth / 2 + 0.02;
    frameGroup.add(portraitMesh);

    // 4. Subtle Glass Reflection Plane
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(photoW, photoH),
      glassMat
    );
    glass.position.z = depth / 2 + 0.021;
    frameGroup.add(glass);

    // 5. Engraved Brass Nameplate
    const brassTex = createBrassTexture(classmate.name, classmate.role);
    brassTex.anisotropy = this.maxAnisotropy;
    brassTex.minFilter = THREE.LinearMipmapLinearFilter;
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: brassTex,
      metalness: 0.85,
      roughness: 0.25
    });
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.32, 0.03),
      plaqueMat
    );
    plaque.position.set(0, -frameH / 2 - 0.32, 0.02);
    frameGroup.add(plaque);

    // 6. Dedicated Spotlight
    const spotTarget = new THREE.Object3D();
    spotTarget.position.copy(position);
    this.scene.add(spotTarget);

    const spotLight = new THREE.SpotLight(0xfff5e6, 2.5);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1.2;
    spotLight.distance = 9;

    const spotOffset = normal.clone().multiplyScalar(2.0);
    spotLight.position.set(
      position.x + spotOffset.x,
      this.height - 0.3,
      position.z + spotOffset.z
    );
    spotLight.target = spotTarget;
    this.scene.add(spotLight);

    // Track light fixture model on ceiling
    const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 10);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.copy(spotLight.position);
    this.scene.add(fixture);

    // 7. Interactive Hitbox for Raycasting
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(frameW + 0.4, frameH + 0.9, 0.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.userData = {
      isFrame: true,
      classmate: classmate,
      frameGroup: frameGroup,
      frameOuter: frameOuter,
      normal: normal,
      position: position
    };
    frameGroup.add(hitbox);
    this.interactableFrames.push(hitbox);

    this.scene.add(frameGroup);
  }

  buildDecorations() {
    const { width, length } = this;

    // 1. Central Tech Benches - dark glass + aluminum + cyan underglow (elegant)
    const createTechBench = (x, z, rotY) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(x, 0, z);
      benchGroup.rotation.y = rotY;

      const seatGeo = new THREE.BoxGeometry(3.2, 0.12, 1.2);
      const seatMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.2,
        metalness: 0.6,
        emissive: 0x001a33,
        emissiveIntensity: 0.12
      });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.55;
      benchGroup.add(seat);

      const glowGeo = new THREE.BoxGeometry(3.0, 0.02, 1.0);
      const glowMat = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 1.4
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 0.48;
      benchGroup.add(glow);

      const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.35, 12);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
      [[-1.4, -0.4], [1.4, -0.4], [-1.4, 0.4], [1.4, 0.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.18, lz);
        benchGroup.add(leg);
      });

      this.scene.add(benchGroup);
    };

    createTechBench(0, -3.5, 0);
    createTechBench(0, 3.5, 0);

    // 2. Holographic Code Displays (replaces torus sculptures) - elegant tech
    const createHologram = (x, z) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(x, 0, z);

      const pedGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.3, metalness: 0.5, emissive: 0x002244, emissiveIntensity: 0.12 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.5;
      pedGroup.add(ped);

      const edgeGeo = new THREE.BoxGeometry(1.02, 0.015, 1.02);
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.0 });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.y = 1.01;
      pedGroup.add(edge);

      const holoGroup = new THREE.Group();
      holoGroup.position.y = 1.85;

      const wireGeo = new THREE.IcosahedronGeometry(0.38, 1);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.52 });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      holoGroup.add(wire);

      const coreGeo = new THREE.IcosahedronGeometry(0.18, 0);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.8, transparent: true, opacity: 0.9 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      holoGroup.add(core);

      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 256; labelCanvas.height = 64;
      const lctx = labelCanvas.getContext('2d');
      lctx.clearRect(0,0,256,64);
      lctx.fillStyle = '#00d4ff';
      lctx.font = 'bold 36px JetBrains Mono, monospace';
      lctx.textAlign = 'center';
      lctx.textBaseline = 'middle';
      lctx.fillText('</>', 128, 32);
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0.9 });
      const label = new THREE.Sprite(labelMat);
      label.position.set(0, 0.55, 0);
      label.scale.set(0.9, 0.22, 1);
      holoGroup.add(label);

      pedGroup.add(holoGroup);
      this.scene.add(pedGroup);

      const holoLight = new THREE.PointLight(0x00d4ff, 0.9, 4, 2);
      holoLight.position.set(x, 1.85, z);
      this.scene.add(holoLight);

      return holoGroup;
    };

    this.sculpture1 = createHologram(-width * 0.24, 0);
    this.sculpture2 = createHologram(width * 0.24, 0);

    // 3. Corner Tech Light Pillars (replaces plants) - elegant
    const createPillar = (x, z) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(x, 0, z);

      const baseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.18, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.4, metalness: 0.6 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.09;
      pillarGroup.add(base);

      const colGeo = new THREE.BoxGeometry(0.22, 2.1, 0.22);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.y = 1.25;
      pillarGroup.add(col);

      const neonGeo = new THREE.BoxGeometry(0.015, 2.0, 0.015);
      const neonMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.2 });
      const neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.set(0.12, 1.25, 0.12);
      pillarGroup.add(neon);

      const topGeo = new THREE.RingGeometry(0.14, 0.16, 16);
      const topMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide });
      const topRing = new THREE.Mesh(topGeo, topMat);
      topRing.rotation.x = -Math.PI/2;
      topRing.position.y = 2.32;
      pillarGroup.add(topRing);

      const pillarLight = new THREE.PointLight(0x00d4ff, 0.55, 3.5, 2);
      pillarLight.position.set(0, 2.35, 0);
      pillarGroup.add(pillarLight);

      const capGeo = new THREE.BoxGeometry(0.24, 0.04, 0.24);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 2.34;
      pillarGroup.add(cap);

      this.scene.add(pillarGroup);
    };

    const cx = width / 2 - 1.6;
    const cz = length / 2 - 1.6;
    createPillar(-cx, -cz);
    createPillar(cx, -cz);
    createPillar(-cx, cz);
    createPillar(cx, cz);
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const getRaycastHit = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactableFrames, false);
      return intersects.length > 0 ? intersects[0].object : null;
    };

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      const hit = getRaycastHit(e);
      if (hit) {
        document.body.style.cursor = 'pointer';
        this.renderer.domElement.style.cursor = 'pointer';
        if (this.hoveredFrame !== hit) {
          this.resetHover();
          this.hoveredFrame = hit;
          hit.userData.frameOuter.material.emissive = new THREE.Color(0x554400);
        }
      } else {
        document.body.style.cursor = 'none';
        this.renderer.domElement.style.cursor = 'none';
        this.resetHover();
      }
    });

    let pointerDownPos = { x: 0, y: 0 };
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 10) return; // Ignore drag gestures

      const hit = getRaycastHit(e);
      if (hit && this.onSelectClassmate) {
        const u = hit.userData;
        this.onSelectClassmate(u.classmate, u.position, u.normal);
      }
    });
  }

  resetHover() {
    if (this.hoveredFrame) {
      this.hoveredFrame.userData.frameOuter.material.emissive = new THREE.Color(0x000000);
      this.hoveredFrame = null;
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    if (this.sculpture1) this.sculpture1.rotation.y += 0.005;
    if (this.sculpture2) this.sculpture2.rotation.y -= 0.005;
    if (this.chandelierGem) { this.chandelierGem.rotation.y += 0.012; this.chandelierGem.rotation.x += 0.005; }

    this.renderer.render(this.scene, this.camera);
  }
}
