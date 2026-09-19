import * as THREE from 'three';
import { MuseumScene } from './world/MuseumScene.js';
import { ControlsManager } from './world/ControlsManager.js';
import { ClassmateModal } from './ui/Modal.js';
import { DirectoryDrawer } from './ui/Directory.js';
import { Minimap } from './ui/Minimap.js';
import { MuseumAudio } from './ui/Audio.js';
import { VirtualJoystick } from './ui/Joystick.js';
import { classmates } from './data/classmates.js';
import { Jumpscare } from './ui/Jumpscare.js';

class App {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.uiContainer = document.getElementById('ui-container');
    this.hudRight = document.getElementById('hud-right');
    this.loadingScreen = document.getElementById('loading-screen');

    this.currentClassmateIndex = 0;
    this.isTourActive = false;
    this.tourTimer = null;

    this.init();
  }

  init() {
    // 1. Initialize 3D Scene - only direct frame clicks trigger jumpscare
    this.scene = new MuseumScene(this.canvasContainer, (classmate, pos, normal) => {
      this.handleSelectClassmate(classmate, pos, normal, true);
    });

    // 2. Initialize Camera Controls
    this.controls = new ControlsManager(
      this.scene.camera,
      this.scene.renderer.domElement,
      (pos, rotY) => {
        this.minimap.update(pos, rotY, this.getFramePositions());
      }
    );

    // 3. Initialize Audio
    this.audio = new MuseumAudio();
    this.setupAudioButton();

    // 4. Initialize Classmate Detail Modal
    this.modal = new ClassmateModal(
      this.uiContainer,
      (direction) => this.navigateClassmate(direction),
      () => {
        // Modal closed
        if (this.isTourActive) this.stopTour();
      }
    );

    // 5. Initialize Directory Roster
    this.directory = new DirectoryDrawer(
      this.hudRight,
      classmates,
      (selected) => {
        this.goToClassmate(selected);
      }
    );

    // 6. Initialize Minimap (hidden by default for clear view)
    this.minimap = new Minimap(
      this.hudRight,
      classmates,
      (clickedClassmate) => {
        this.goToClassmate(clickedClassmate);
      }
    );
    this.minimap.element.classList.add('hidden');

    // 7. Initialize Virtual Joystick for Mobile
    this.joystick = new VirtualJoystick(document.body, (vec) => {
      this.controls.setJoystickInput(vec);
    });

    // 8. Jumpscare Easter Egg for cs-4 (every frame click, during zoom)
    this.jumpscare = new Jumpscare();

    // 9. HUD Buttons
    this.setupHudButtons();

    // 8. Handle Window Resize
    window.addEventListener('resize', () => {
      this.scene.onResize();
    });

    // 9. Hide Loading Screen
    setTimeout(() => {
      this.loadingScreen.classList.add('fade-out');
    }, 600);

    // 10. Start Animation Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  getFramePositions() {
    return this.scene.interactableFrames.map(f => ({
      classmate: f.userData.classmate,
      position: f.userData.position
    }));
  }

  handleSelectClassmate(classmate, pos, normal, isDirectFrameClick = false) {
    const idx = classmates.findIndex(c => c.id === classmate.id);
    if (idx !== -1) {
      this.currentClassmateIndex = idx;
    }

    // Jumpscare only on direct frame click, not on Virtual Tour / Directory
    const isJumpscareTarget = classmate.id === 'cs-4';
    if (isDirectFrameClick && isJumpscareTarget && this.jumpscare) {
      this.jumpscare.trigger();
    }

    this.controls.focusOnFrame(pos, normal, () => {
      this.modal.show(classmate, this.currentClassmateIndex, classmates.length);
    });
  }

  goToClassmate(classmate) {
    const frameObj = this.scene.interactableFrames.find(
      f => f.userData.classmate.id === classmate.id
    );

    if (frameObj) {
      const u = frameObj.userData;
      // false = not a direct frame click, so no jumpscare (prevents Virtual Tour trigger)
      this.handleSelectClassmate(u.classmate, u.position, u.normal, false);
    }
  }

  navigateClassmate(direction) {
    let nextIdx = this.currentClassmateIndex + direction;
    if (nextIdx < 0) nextIdx = classmates.length - 1;
    if (nextIdx >= classmates.length) nextIdx = 0;

    const nextClassmate = classmates[nextIdx];
    this.goToClassmate(nextClassmate);
  }

  setupAudioButton() {
    const audioBtn = document.getElementById('btn-audio');
    const audioIcon = document.getElementById('audio-icon');
    const audioText = document.getElementById('audio-text');

    audioBtn.addEventListener('click', async () => {
      const isPlaying = await this.audio.toggle();
      audioIcon.textContent = isPlaying ? '🔊' : '🔇';
      audioText.textContent = isPlaying ? 'Mute' : 'Ambience';
      audioBtn.style.borderColor = isPlaying ? 'var(--gold)' : '';
    });
  }

  setupHudButtons() {
    // Reset to Center
    const resetBtn = document.getElementById('btn-reset');
    resetBtn.addEventListener('click', () => {
      if (this.isTourActive) this.stopTour();
      this.modal.hide();
      this.controls.resetToCenter();
    });

    // Virtual Tour
    const tourBtn = document.getElementById('btn-tour');
    tourBtn.addEventListener('click', () => {
      if (this.isTourActive) {
        this.stopTour();
      } else {
        this.startTour();
      }
    });

    // Toggle Minimap
    const mapBtn = document.getElementById('btn-map');
    if (mapBtn) {
      mapBtn.addEventListener('click', () => {
        const isNowOpen = !this.minimap.element.classList.contains('hidden');
        this.minimap.element.classList.toggle('hidden');
        mapBtn.style.borderColor = isNowOpen ? '' : 'var(--gold)';
      });
    }
  }

  startTour() {
    this.isTourActive = true;
    const tourBtn = document.getElementById('btn-tour');
    tourBtn.innerHTML = '<span>⏹️</span><span>Stop Tour</span>';
    tourBtn.style.borderColor = 'var(--gold)';

    this.currentClassmateIndex = 0;
    this.goToClassmate(classmates[this.currentClassmateIndex]);

    this.tourTimer = setInterval(() => {
      if (!this.isTourActive) return;
      this.navigateClassmate(1);
    }, 6500);
  }

  stopTour() {
    this.isTourActive = false;
    clearInterval(this.tourTimer);
    const tourBtn = document.getElementById('btn-tour');
    tourBtn.innerHTML = '<span>🏛️</span><span>Virtual Tour</span>';
    tourBtn.style.borderColor = '';
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.controls.update(delta);
    this.scene.render();
  }
}

// Launch on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
