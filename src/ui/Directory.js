export class DirectoryDrawer {
  constructor(container, classmates, onSelectClassmate) {
    this.container = container;
    this.classmates = classmates;
    this.onSelectClassmate = onSelectClassmate;
    this.isOpen = false;

    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'directory-wrapper';
    this.element.innerHTML = `
      <button class="directory-toggle-btn" id="dir-toggle">
        <span class="dir-icon">👥</span>
        <span class="dir-btn-text">Class Roster (${this.classmates.length})</span>
      </button>

      <div class="directory-panel hidden" id="dir-panel">
        <div class="directory-header">
          <div>
            <h3>Gallery Roster</h3>
            <p class="dir-subtitle">Select a classmate to visit their portrait</p>
          </div>
          <button class="dir-close-btn" id="dir-close">&times;</button>
        </div>

        <div class="directory-search-box">
          <input type="text" id="dir-search" placeholder="Search by name, nickname, or role..." />
        </div>

        <div class="directory-list" id="dir-list">
          <!-- Classmates cards rendered here -->
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
    this.renderList(this.classmates);
  }

  bindEvents() {
    const toggleBtn = this.element.querySelector('#dir-toggle');
    const panel = this.element.querySelector('#dir-panel');
    const closeBtn = this.element.querySelector('#dir-close');
    const searchInput = this.element.querySelector('#dir-search');

    toggleBtn.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      panel.classList.toggle('hidden', !this.isOpen);
      if (this.isOpen) {
        searchInput.focus();
      }
    });

    closeBtn.addEventListener('click', () => {
      this.close();
    });

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = this.classmates.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.nickname && c.nickname.toLowerCase().includes(q)) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.wall && c.wall.toLowerCase().includes(q))
      );
      this.renderList(filtered);
    });
  }

  renderList(items) {
    const listContainer = this.element.querySelector('#dir-list');
    listContainer.innerHTML = '';

    if (items.length === 0) {
      listContainer.innerHTML = `<div class="dir-empty">No classmates found matching your search.</div>`;
      return;
    }

    items.forEach(c => {
      const card = document.createElement('div');
      card.className = 'directory-card';
      card.innerHTML = `
        <div class="dir-card-avatar" style="border-color: ${c.color || '#d4af37'}">
          <img src="${c.image || ''}" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="dir-card-fallback" style="display:none; background:${c.color || '#333'}">
            ${c.name.charAt(0)}
          </div>
        </div>
        <div class="dir-card-info">
          <div class="dir-card-name">${c.name}</div>
          <div class="dir-card-role">${c.role || 'Classmate'}</div>
          <div class="dir-card-wall-tag">${(c.wall || 'north').toUpperCase()} WALL</div>
        </div>
        <div class="dir-card-arrow">&#8594;</div>
      `;

      card.addEventListener('click', () => {
        this.close();
        if (this.onSelectClassmate) {
          this.onSelectClassmate(c);
        }
      });

      listContainer.appendChild(card);
    });
  }

  close() {
    this.isOpen = false;
    this.element.querySelector('#dir-panel').classList.add('hidden');
  }
}
