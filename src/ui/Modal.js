export class ClassmateModal {
  constructor(container, onNavigate, onClose) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.onClose = onClose;
    this.currentClassmate = null;

    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.innerHTML = `
      <div class="modal-card">
        <button class="modal-close-btn" aria-label="Close modal">&times;</button>

        <div class="modal-body">
          <div class="modal-image-col">
            <div class="modal-frame-wrapper">
              <img id="modal-img" src="" alt="Classmate portrait" />
            </div>
          </div>

          <div class="modal-info-col">
            <div class="modal-header-section">
              <h2 class="modal-name" id="modal-name">Name</h2>
            </div>

            <div class="modal-quote-box">
              <div class="quote-mark">"</div>
              <p class="modal-quote" id="modal-quote">Quote goes here.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-nav btn-prev" id="btn-modal-prev">
            <span>&#8592;</span> Previous Classmate
          </button>
          <div class="modal-index-indicator" id="modal-counter">1 / 10</div>
          <button class="btn-nav btn-next" id="btn-modal-next">
            Next Classmate <span>&#8594;</span>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    this.element.querySelector('.modal-close-btn').addEventListener('click', () => this.hide());

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.hide();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.element.classList.contains('hidden')) this.hide();
    });

    this.element.querySelector('#btn-modal-prev').addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate(-1);
    });

    this.element.querySelector('#btn-modal-next').addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate(1);
    });
  }

  show(classmate, currentIndex, totalCount) {
    this.currentClassmate = classmate;

    const img = this.element.querySelector('#modal-img');
    img.src = classmate.image || '';
    img.alt = classmate.name;

    this.element.querySelector('#modal-name').textContent = classmate.name;
    this.element.querySelector('#modal-quote').textContent = classmate.quote || 'Ready to make history.';
    this.element.querySelector('#modal-counter').textContent = `${currentIndex + 1} / ${totalCount}`;

    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
    if (this.onClose) this.onClose();
  }
}
