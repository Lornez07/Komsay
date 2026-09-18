export class VirtualJoystick {
  constructor(container, onMove) {
    this.container = container;
    this.onMove = onMove;
    this.activeTouchId = null;
    this.baseRadius = 50; // max travel radius in px

    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'mobile-joystick-wrapper';
    this.element.innerHTML = `
      <div class="joystick-base" id="joystick-base">
        <div class="joystick-knob" id="joystick-knob"></div>
        <div class="joystick-label">MOVE</div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.base = this.element.querySelector('#joystick-base');
    this.knob = this.element.querySelector('#joystick-knob');

    this.bindEvents();
  }

  bindEvents() {
    const handleStart = (e) => {
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      this.activeTouchId = touch.identifier ?? 'mouse';
      this.updateKnob(touch.clientX, touch.clientY);
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMove = (e) => {
      if (this.activeTouchId === null) return;
      let touch = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.activeTouchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
      } else {
        touch = e;
      }
      if (!touch) return;

      this.updateKnob(touch.clientX, touch.clientY);
      e.preventDefault();
      e.stopPropagation();
    };

    const handleEnd = (e) => {
      if (this.activeTouchId === null) return;
      let matched = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.activeTouchId) {
            matched = true;
            break;
          }
        }
      } else {
        matched = true;
      }

      if (matched) {
        this.activeTouchId = null;
        this.resetKnob();
        e.preventDefault();
        e.stopPropagation();
      }
    };

    this.base.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });
  }

  updateKnob(clientX, clientY) {
    const rect = this.base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const dist = Math.hypot(deltaX, deltaY);

    const clampedDist = Math.min(this.baseRadius, dist);
    const angle = Math.atan2(deltaY, deltaX);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    const normX = knobX / this.baseRadius;
    const normY = knobY / this.baseRadius;

    if (this.onMove) {
      this.onMove({ x: normX, y: normY });
    }
  }

  resetKnob() {
    this.knob.style.transform = 'translate(0px, 0px)';
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });
    }
  }
}
