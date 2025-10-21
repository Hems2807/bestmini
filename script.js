// ========== Initialize App ==========
function initApp() {
  if (!localStorage.getItem('findit_items')) {
    localStorage.setItem('findit_items', JSON.stringify([]));
  }
}

// ========== Utility to Get & Save ==========
function getItems() {
  return JSON.parse(localStorage.getItem('findit_items')) || [];
}

function saveItems(items) {
  localStorage.setItem('findit_items', JSON.stringify(items));
}

// ========== Render Functions ==========

// render all items (for Home page)
function renderAll() {
  const items = getItems();
  renderCards(items, 'itemsGrid');
}

// render only Lost
function renderLostOnly() {
  const items = getItems().filter(i => i.type === 'Lost');
  renderCards(items, 'lostGridOnly');
}

// render only Found
function renderFoundOnly() {
  const items = getItems().filter(i => i.type === 'Found');
  renderCards(items, 'foundGridOnly');
}

// reusable card renderer
function renderCards(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `<p class="muted">No items available.</p>`;
    return;
  }

  items.forEach(item => { 
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-img">
      ${item.image 
        ? `<img src="${item.image}" alt="${item.title}" />` 
        : `<div class="muted">No Image</div>`}
    </div>
    <div class="card-body">
      <h3>${item.title}</h3>
      <p>${item.description || ''}</p>
      <p><strong>Place:</strong> ${item.place}</p>
      <p><strong>Date:</strong> ${item.date || '-'}</p>
      <p><strong>Posted by:</strong> ${item.poster} (${item.contact})</p>
 <div class="tag-row">
  <div class="tag ${item.type === 'Lost' ? 'lost' : 'found'}">${item.type}</div>
  ${item.type === 'Found' ? `
    <button class="claim-btn">Claim</button>
    <input type="file" class="proof-upload" accept="image/*" style="display:none;">
  ` : ''}
</div>

  `;

  // Add button logic
  const claimBtn = card.querySelector('.claim-btn');
  const proofInput = card.querySelector('.proof-upload');

  if (claimBtn && proofInput) {
    claimBtn.addEventListener('click', () => {
      alert('Please upload a screenshot (e.g., Amazon bill or receipt) as proof of ownership.');
      proofInput.click(); // opens file chooser
    });

    proofInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        alert(`Proof image "${file.name}" uploaded successfully!`);
        // You can extend this part to upload/save the image later
      }
    });
  }

  container.appendChild(card);
});

}

// ========== Modal (Add Item) Logic ==========
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const addModalTitle = document.getElementById('addModalTitle');
let selectedType = null;

// -------- FIXED Add Button Setup --------
function setupAddButtons() {
  const lostBtns = document.querySelectorAll('#addLostBtn');
  const foundBtns = document.querySelectorAll('#addFoundBtn');

  lostBtns.forEach(btn =>
    btn.addEventListener('click', () => openAddModal('Lost'))
  );
  foundBtns.forEach(btn =>
    btn.addEventListener('click', () => openAddModal('Found'))
  );
}

// open modal
function openAddModal(type) {
  selectedType = type;
  addModalTitle.textContent = `Add ${type} Item`;
  addModal.style.display = 'flex';
  addModal.setAttribute('aria-hidden', 'false');
}

// close modal
document.getElementById('cancelAdd')?.addEventListener('click', () => {
  addModal.style.display = 'none';
  addModal.setAttribute('aria-hidden', 'true');
  addForm.reset();
  selectedType = null;
});

// -------- FIXED Lost/Found toggle inside modal --------
document.addEventListener('click', (e) => {
  const lostBtn = e.target.closest && e.target.closest('#chooseLost');
  const foundBtn = e.target.closest && e.target.closest('#chooseFound');
  if (lostBtn) {
    selectedType = 'Lost';
    lostBtn.classList.add('active');
    document.querySelector('#chooseFound')?.classList.remove('active');
  }
  if (foundBtn) {
    selectedType = 'Found';
    foundBtn.classList.add('active');
    document.querySelector('#chooseLost')?.classList.remove('active');
  }
});

// preview image
document.getElementById('itemImage')?.addEventListener('change', e => {
  const file = e.target.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = () => (preview.innerHTML = `<img src="${reader.result}" alt="preview" style="max-width:100px;border-radius:8px;">`);
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = 'No image';
  }
});

// submit form
addForm?.addEventListener('submit', e => {
  e.preventDefault();

  if (!selectedType) {
    alert('Please select Lost or Found type.');
    return;
  }

  const newItem = {
    id: Date.now(),
    type: selectedType,
    title: document.getElementById('itemTitle').value.trim(),
    place: document.getElementById('itemPlace').value.trim(),
    date: document.getElementById('itemDate').value,
    description: document.getElementById('itemDesc').value.trim(),
    poster: document.getElementById('posterName').value.trim(),
    contact: document.getElementById('posterContact').value.trim(),
    image: document.getElementById('imagePreview').querySelector('img')?.src || ''
  };

  const items = getItems();
  items.push(newItem);
  saveItems(items);

  addModal.style.display = 'none';
  addForm.reset();
  selectedType = null;

  // refresh correct list
  if (document.getElementById('itemsGrid')) renderAll();
  else if (document.getElementById('lostGridOnly')) renderLostOnly();
  else if (document.getElementById('foundGridOnly')) renderFoundOnly();
});

// ========== Search ==========
function setupSearch(inputId, clearBtnId, renderFn, typeFilter = null) {
  const input = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    let items = getItems();
    if (typeFilter) items = items.filter(i => i.type === typeFilter);
    const filtered = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.place.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
    renderCards(filtered, renderFn === renderAll ? 'itemsGrid' :
      renderFn === renderLostOnly ? 'lostGridOnly' : 'foundGridOnly');
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    renderFn();
  });
}

// ========== Initialize on Page Load ==========
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupAddButtons();

  if (document.getElementById('itemsGrid')) {
    renderAll();
    setupSearch('searchInput', 'clearSearch', renderAll);
  } else if (document.getElementById('lostGridOnly')) {
    renderLostOnly();
    setupSearch('searchLost', 'clearSearchLost', renderLostOnly, 'Lost');
  } else if (document.getElementById('foundGridOnly')) {
    renderFoundOnly();
    setupSearch('searchFound', 'clearSearchFound', renderFoundOnly, 'Found');
  }
});
