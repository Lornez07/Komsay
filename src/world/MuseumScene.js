import * as THREE from 'three';
import {
  createWoodFloorTexture,
  createWoodBumpTexture,
  createBrassTexture,
  createAvatarTexture
} from './textures.js';
import { classmates, museumConfig } from '../data/classmates.js';

export class MuseumScene {
  constructor(canvasContainer, onSelectClassmate) {
    this.container = canvasContainer;
    this.onSelectClassmate = onSelectClassmate;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#12151d');

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

    // 1. Flooring
    const floorTex = createWoodFloorTexture();
    const bumpTex = createWoodBumpTexture();
    // Reduce shimmer on high-frequency parquet at distance
    floorTex.anisotropy = this.maxAnisotropy;
    bumpTex.anisotropy = this.maxAnisotropy;
    floorTex.minFilter = THREE.LinearMipmapLinearFilter;
    bumpTex.minFilter = THREE.LinearMipmapLinearFilter;
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      roughness: 0.35,
      metalness: 0.05,
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

    // 4. Museum Walls (Warm gallery tone, clearly visible)
    const wallColor = 0xeeece6; // Warm light museum gallery beige/white
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.75,
      metalness: 0.02,
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

    // 5. Dark Wood Baseboard Trims
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x18120c, roughness: 0.5 });
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

    // 6. Grand Graduation Wall Banner on North Wall
    this.buildHonorBanner();

    // 7. Elegant Architecture: Crown Molding + South Grand Arch + Classical Columns
    this.buildCrownMolding();
    this.buildSouthGrandArch();
    this.buildClassicalColumns();
  }

  buildHonorBanner() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Rich dark gradient with gold accents
    const grad = ctx.createLinearGradient(0, 0, 2048, 256);
    grad.addColorStop(0, '#0c1017');
    grad.addColorStop(0.5, '#19202f');
    grad.addColorStop(1, '#0c1017');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 256);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 2048 - 32, 256 - 32);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top subtitle
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 36px "Cinzel", serif';
    ctx.fillText('🎓 DEPARTMENT OF COMPUTER SCIENCE • CLASS OF 2026 🎓', 1024, 75);

    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Playfair Display", serif';
    ctx.fillText('GRADUATION HALL OF HONORS', 1024, 155);

    // Subtext
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 28px "Inter", sans-serif';
    ctx.fillText('11 Visionary Computer Science Graduates • Forever Batch of 2026', 1024, 215);

    const texture = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 1.6), bannerMat);
    bannerMesh.position.set(0, this.height - 0.95, -this.length / 2 + 0.08);
    this.scene.add(bannerMesh);
  }

  buildCrownMolding() {
    const { width, length, height } = this;
    const moldingY = height - 0.18;
    const moldingH = 0.22;
    const moldingD = 0.14;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.28 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 0.7 });

    // Thin gold cap
    const addMolding = (w, h, d, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goldMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      const under = new THREE.Mesh(new THREE.BoxGeometry(w, h*0.55, d*0.9), darkMat);
      under.position.set(x, y - h*0.62, z);
      this.scene.add(under);
    };
    addMolding(width, moldingH, moldingD, 0, moldingY, -length/2 + moldingD/2);
    addMolding(width, moldingH, moldingD, 0, moldingY, length/2 - moldingD/2);
    addMolding(moldingD, moldingH, length, -width/2 + moldingD/2, moldingY, 0);
    addMolding(moldingD, moldingH, length, width/2 - moldingD/2, moldingY, 0);
  }

  buildSouthGrandArch() {
    // Now as twin classical columns flanking the group (no lintel) - as requested
    const { length, height } = this;
    const span = 11.4; // distance between columns, wider than group 9.5
    const z = length/2 - 0.24;
    const colH = height - 0.55;
    const colR = 0.32;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.84, roughness: 0.26 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe8ddd0, roughness: 0.82 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 0.6 });

    const makeSouthColumn = (x) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.32, 0.78), baseMat);
      base.position.y = 0.16;
      grp.add(base);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.66), goldMat);
      plinth.position.y = 0.39;
      grp.add(plinth);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR*0.92, colH, 16), stoneMat);
      shaft.position.y = colH/2 + 0.46;
      grp.add(shaft);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(colR*1.28, colR*1.08, 0.30, 16), goldMat);
      cap.position.y = colH + 0.46 + 0.15;
      grp.add(cap);
      const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.15, 0.78), goldMat);
      abacus.position.y = colH + 0.46 + 0.37;
      grp.add(abacus);
      this.scene.add(grp);
    };
    makeSouthColumn(-span/2);
    makeSouthColumn(span/2);
  }

  buildClassicalColumns() {
    const { width, length, height } = this;
    const colH = height - 0.55;
    const colR = 0.26;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.88, roughness: 0.22 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe1, roughness: 0.72 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 0.6 });

    const makeColumn = (x, z) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.72), baseMat);
      base.position.y = 0.16;
      grp.add(base);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), goldMat);
      plinth.position.y = 0.38;
      grp.add(plinth);
      // Shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR*0.92, colH, 16), stoneMat);
      shaft.position.y = colH/2 + 0.44;
      grp.add(shaft);
      // Fluting hint via subtle scale
      // Capital
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(colR*1.25, colR*1.08, 0.28, 16), goldMat);
      cap.position.y = colH + 0.44 + 0.14;
      grp.add(cap);
      const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.72), goldMat);
      abacus.position.y = colH + 0.44 + 0.35;
      grp.add(abacus);
      this.scene.add(grp);
    };

    const inset = 1.15;
    // 4 corners only (removed 2 mid-north pilasters as requested)
    makeColumn(-width/2 + inset, -length/2 + inset);
    makeColumn(width/2 - inset, -length/2 + inset);
    makeColumn(-width/2 + inset, length/2 - inset);
    makeColumn(width/2 - inset, length/2 - inset);
  }

  buildLighting() {
    // 1. High ambient illumination for crisp, clear visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    // 2. Hemisphere bounce light (Sky to Floor)
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x334155, 0.9);
    this.scene.add(hemiLight);

    // 3. Directional skylight downlight
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(0, this.height - 0.5, 0);
    this.scene.add(sunLight);

    // 4. Wall-facing fill lights to ensure each wall is bright and radiant
    const makeWallFill = (x, y, z, targetX, targetZ) => {
      const light = new THREE.DirectionalLight(0xfff8ee, 0.5);
      light.position.set(x, y, z);
      light.target.position.set(targetX, y, targetZ);
      this.scene.add(light);
      this.scene.add(light.target);
    };

    makeWallFill(0, 3.5, 0, 0, -this.length / 2); // North
    makeWallFill(0, 3.5, 0, 0, this.length / 2);  // South
    makeWallFill(0, 3.5, 0, this.width / 2, 0);  // East
    makeWallFill(0, 3.5, 0, -this.width / 2, 0); // West
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

        // South group is now solo - make it panoramic bigger/longer, move higher
        const isGroup = classmate.isGroup;
        const w = isGroup ? 9.5 : frameW;
        const h = isGroup ? 4.2 : frameH;
        if (wallType === 'south' && isGroup) {
          pos.y = eyeLevel + 0.75; // raise so bottom not hitting floor (was 2.4, now 3.15)
        }

        this.createFrameObject(classmate, pos, rotY, normal, w, h);
      });
    };

    layoutWall(wallGroups.north, width, 'north');
    layoutWall(wallGroups.east, length, 'east');
    layoutWall(wallGroups.west, length, 'west');
    layoutWall(wallGroups.south, width, 'south');
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

    // 1. Central Museum Benches
    const createBench = (x, z, rotY) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(x, 0, z);
      benchGroup.rotation.y = rotY;

      const seatGeo = new THREE.BoxGeometry(3.2, 0.45, 1.2);
      const seatMat = new THREE.MeshStandardMaterial({
        color: 0x1e1610,
        roughness: 0.4
      });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.55;
      benchGroup.add(seat);

      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
      [[-1.4, -0.4], [1.4, -0.4], [-1.4, 0.4], [1.4, 0.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.18, lz);
        benchGroup.add(leg);
      });

      this.scene.add(benchGroup);
    };

    createBench(0, -3.5, 0);
    createBench(0, 3.5, 0);

    // 2. Sculptures on Pedestals
    const createSculpture = (x, z) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(x, 0, z);

      const pedGeo = new THREE.BoxGeometry(1.0, 1.3, 1.0);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.3 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.65;
      pedGroup.add(ped);

      const artGeo = new THREE.TorusKnotGeometry(0.35, 0.1, 100, 16, 2, 3);
      const artMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.2
      });
      const art = new THREE.Mesh(artGeo, artMat);
      art.position.y = 1.8;
      pedGroup.add(art);

      this.scene.add(pedGroup);
      return art;
    };

    this.sculpture1 = createSculpture(-width * 0.24, 0);
    this.sculpture2 = createSculpture(width * 0.24, 0);

    // 3. Corner Plants
    const createPlant = (x, z) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(x, 0, z);

      const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.7, 16);
      const potMat = new THREE.MeshStandardMaterial({ color: 0x272b38 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.y = 0.35;
      plantGroup.add(pot);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f6630 });
      for (let i = 0; i < 7; i++) {
        const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
        leafGeo.scale(0.7, 1.4, 0.2);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const a = (i / 7) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.2, 0.95 + (i % 2) * 0.25, Math.sin(a) * 0.2);
        leaf.rotation.set(0.3, a, 0.2);
        plantGroup.add(leaf);
      }

      this.scene.add(plantGroup);
    };

    const cx = width / 2 - 2.0;
    const cz = length / 2 - 2.0;
    createPlant(-cx, -cz);
    createPlant(cx, -cz);
    createPlant(-cx, cz);
    createPlant(cx, cz);
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

    this.renderer.render(this.scene, this.camera);
  }
}
