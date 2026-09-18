import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { museumConfig } from '../data/classmates.js';

export class ControlsManager {
  constructor(camera, domElement, onPositionChange) {
    this.camera = camera;
    this.domElement = domElement;
    this.onPositionChange = onPositionChange;

    this.isLocked = false;
    this.isDragging = false;
    this.isTransitioning = false;
    this.isTouchUser = false;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.joystickInput = { x: 0, y: 0 };
    this.speed = 7.5; // units per second
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Euler rotation (yaw & pitch)
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.minPolarAngle = -Math.PI / 2.5; // looking up limit
    this.maxPolarAngle = Math.PI / 2.5;  // looking down limit
    this.sensitivity = 0.0036;

    // Head bobbing
    this.bobTimer = 0;
    this.eyeHeight = 1.8;

    // Bounds
    const { width, length } = museumConfig.roomDimensions;
    this.bounds = {
      minX: -width / 2 + 1.6,
      maxX: width / 2 - 1.6,
      minZ: -length / 2 + 1.6,
      maxZ: length / 2 - 1.6
    };

    this.initEventListeners();
  }

  setJoystickInput(input) {
    this.joystickInput = input;
  }

  initEventListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.edgeTurnRate = 0;
    let prevMouseX = null;
    let prevMouseY = null;

    window.addEventListener('mousemove', (e) => {
      if (this.isTransitioning || this.isTouchUser) return;

      let mx = e.movementX;
      let my = e.movementY;

      if (mx === undefined) {
        mx = prevMouseX !== null ? e.clientX - prevMouseX : 0;
        my = prevMouseY !== null ? e.clientY - prevMouseY : 0;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Direct, fast camera turn following mouse movement
      if (Math.abs(mx) < 300 && Math.abs(my) < 300) {
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= mx * this.sensitivity;
        this.euler.x -= my * this.sensitivity;
        this.euler.x = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
      }

      // Continuous edge rotation when mouse is at screen sides
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      if (Math.abs(normX) > 0.65) {
        const factor = (Math.abs(normX) - 0.65) / 0.35;
        this.edgeTurnRate = -Math.sign(normX) * factor * 2.4;
      } else {
        this.edgeTurnRate = 0;
      }
    });

    window.addEventListener('mouseleave', () => {
      this.edgeTurnRate = 0;
      prevMouseX = null;
      prevMouseY = null;
    });

    // Touch support for mobile devices
    let touchStart = { x: 0, y: 0 };
    this.domElement.addEventListener('touchstart', (e) => {
      this.isTouchUser = true;
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      if (this.isTransitioning) return;
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStart.x;
        const deltaY = e.touches[0].clientY - touchStart.y;
        this.rotateCamera(deltaX * 1.6, deltaY * 1.6);
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });
  }

  rotateCamera(deltaX, deltaY) {
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= deltaX * this.sensitivity;
    this.euler.x -= deltaY * this.sensitivity;
    this.euler.x = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
    this.targetEulerY = this.euler.y;
    this.targetEulerX = this.euler.x;
  }

  onKeyDown(event) {
    if (this.isTransitioning) return;
    // Don't hijack keystrokes if typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }

  /**
   * Smoothly animates camera to inspect a painting
   */
  focusOnFrame(framePos, normal, onComplete) {
    this.isTransitioning = true;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // Target position: in front of frame at viewing distance
    const viewDistance = 3.2;
    const targetPos = framePos.clone().add(normal.clone().multiplyScalar(viewDistance));
    targetPos.y = framePos.y; // Match frame height

    // Target rotation: looking directly at frame
    const dummyCamera = this.camera.clone();
    dummyCamera.position.copy(targetPos);
    dummyCamera.lookAt(framePos);

    const startPos = this.camera.position.clone();
    const startRot = this.camera.quaternion.clone();
    const endRot = dummyCamera.quaternion;

    const animObj = { t: 0 };

    new TWEEN.Tween(animObj)
      .to({ t: 1 }, 1200)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.camera.position.lerpVectors(startPos, targetPos, animObj.t);
        this.camera.quaternion.slerpQuaternions(startRot, endRot, animObj.t);
        this.euler.setFromQuaternion(this.camera.quaternion);
      })
      .onComplete(() => {
        this.isTransitioning = false;
        if (onComplete) onComplete();
      })
      .start();
  }

  /**
   * Smoothly returns to central viewing stance
   */
  resetToCenter(onComplete) {
    this.isTransitioning = true;
    const targetPos = new THREE.Vector3(0, this.eyeHeight, 10);
    const targetLook = new THREE.Vector3(0, this.eyeHeight, 0);

    const dummyCamera = this.camera.clone();
    dummyCamera.position.copy(targetPos);
    dummyCamera.lookAt(targetLook);

    const startPos = this.camera.position.clone();
    const startRot = this.camera.quaternion.clone();
    const endRot = dummyCamera.quaternion;

    const animObj = { t: 0 };
    new TWEEN.Tween(animObj)
      .to({ t: 1 }, 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.camera.position.lerpVectors(startPos, targetPos, animObj.t);
        this.camera.quaternion.slerpQuaternions(startRot, endRot, animObj.t);
        this.euler.setFromQuaternion(this.camera.quaternion);
      })
      .onComplete(() => {
        this.isTransitioning = false;
        if (onComplete) onComplete();
      })
      .start();
  }

  update(delta) {
    TWEEN.update();

    if (this.isTransitioning) return;

    // Continuous edge rotation when mouse is near window boundary
    if (this.edgeTurnRate !== 0 && !this.isTransitioning && !this.isTouchUser) {
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y += this.edgeTurnRate * delta;
      this.camera.quaternion.setFromEuler(this.euler);
    }

    // Walking physics
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    let dirZ = Number(this.moveForward) - Number(this.moveBackward);
    let dirX = Number(this.moveRight) - Number(this.moveLeft);

    // Joystick input (y: negative is forward, positive is back; x: strafe)
    if (this.joystickInput && (this.joystickInput.x !== 0 || this.joystickInput.y !== 0)) {
      dirX += this.joystickInput.x;
      dirZ += -this.joystickInput.y;
    }

    this.direction.set(dirX, 0, dirZ);
    const moveMagnitude = this.direction.length();

    if (moveMagnitude > 0.05) {
      this.direction.normalize();
      const speedFactor = Math.min(1, moveMagnitude);
      this.velocity.z -= this.direction.z * this.speed * 10.0 * delta * speedFactor;
      this.velocity.x -= this.direction.x * this.speed * 10.0 * delta * speedFactor;
    }

    // Camera forward/right vectors in XZ plane
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.euler.y, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.euler.y, 0));

    const moveStep = new THREE.Vector3()
      .addScaledVector(forward, -this.velocity.z * delta)
      .addScaledVector(right, -this.velocity.x * delta);

    this.camera.position.add(moveStep);

    // Wall collision clamping
    this.camera.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.camera.position.z));

    // Subtle head bobbing when moving
    const isMoving = moveMagnitude > 0.1;
    if (isMoving) {
      this.bobTimer += delta * 10;
      this.camera.position.y = this.eyeHeight + Math.sin(this.bobTimer) * 0.04;
    } else {
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.eyeHeight, 0.1);
    }

    if (this.onPositionChange) {
      this.onPositionChange(this.camera.position, this.euler.y);
    }
  }
}
