/**
 * VoteSecure - Candidate Management Controller
 * Handles manual entry of candidates, file uploads for photos & symbols, Base64 preview/storage,
 * professional cards grid, search, filter, and lifecycle status.
 */

const PRESET_SYMBOLS = [
  { id: 'torch', name: 'Torch of Progress', path: 'assets/symbols/torch.svg' },
  { id: 'sun', name: 'Rising Sun', path: 'assets/symbols/sun.svg' },
  { id: 'star', name: 'Guiding Star', path: 'assets/symbols/star.svg' },
  { id: 'book', name: 'Open Book', path: 'assets/symbols/book.svg' },
  { id: 'shield', name: 'Shield of Integrity', path: 'assets/symbols/shield.svg' },
  { id: 'pen', name: 'Quill of Governance', path: 'assets/symbols/pen.svg' },
  { id: 'compass', name: 'Compass of Direction', path: 'assets/symbols/compass.svg' }
];

let currentCandidatesList = [];
let candidateToDeleteId = null;

let currentUploadedPhotoBase64 = null;
let currentUploadedSymbolBase64 = null;
let currentSelectedPresetSymbol = PRESET_SYMBOLS[0];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initCandidateManagement();
});

function setupLayout() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }
}

function initCandidateManagement() {
  renderPresetSymbolButtons();
  populateDropdownFilters();
  setupFileUploadListeners();

  // Check URL query parameters (e.g. from Posts page assign button)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedPostId = urlParams.get('postId');
  if (requestedPostId) {
    const postFilter = document.getElementById('candidate-post-filter');
    if (postFilter) postFilter.value = requestedPostId;
  }

  loadCandidates();

  // Search input
  const searchInput = document.getElementById('candidate-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderCandidates());
  }

  // Filter dropdowns
  const elecFilter = document.getElementById('candidate-election-filter');
  if (elecFilter) {
    elecFilter.addEventListener('change', () => {
      populatePostDropdowns(elecFilter.value);
      filterAndRenderCandidates();
    });
  }

  const postFilter = document.getElementById('candidate-post-filter');
  if (postFilter) {
    postFilter.addEventListener('change', () => filterAndRenderCandidates());
  }

  const statusFilter = document.getElementById('candidate-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => filterAndRenderCandidates());
  }

  // Add Candidate modal button
  const openAddBtn = document.getElementById('btn-open-add-candidate');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      resetCandidateForm();
      document.getElementById('modal-candidate-title').textContent = 'Add Candidate';
      document.getElementById('candidate-form-mode').value = 'add';
      document.getElementById('candidate-original-id').value = '';

      const idInput = document.getElementById('candidate-id-input');
      idInput.removeAttribute('readonly');
      idInput.value = '';

      Utils.openModal('candidate-modal');
    });
  }

  // Candidate form submit
  const form = document.getElementById('candidate-form');
  if (form) {
    form.addEventListener('submit', handleCandidateFormSubmit);
  }

  // Delete confirm button
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete-candidate');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleConfirmDeleteCandidate);
  }

  // Modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', function() {
      const target = this.getAttribute('data-close-modal');
      Utils.closeModal(target);
    });
  });
}

/**
 * Render Preset Symbol Buttons
 */
function renderPresetSymbolButtons() {
  const container = document.getElementById('preset-symbol-list');
  if (!container) return;

  container.innerHTML = '';
  PRESET_SYMBOLS.forEach(sym => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-secondary';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '0.35rem';
    btn.innerHTML = `
      <img src="../${sym.path}" style="width: 18px; height: 18px;" alt="${sym.name}">
      <span>${sym.name}</span>
    `;

    btn.addEventListener('click', () => {
      selectPresetSymbol(sym);
    });

    container.appendChild(btn);
  });
}

function selectPresetSymbol(sym) {
  currentSelectedPresetSymbol = sym;
  currentUploadedSymbolBase64 = null;

  const previewEl = document.getElementById('candidate-symbol-preview');
  if (previewEl) previewEl.src = `../${sym.path}`;

  const nameInput = document.getElementById('candidate-symbol-name-input');
  if (nameInput) nameInput.value = sym.name;

  const removeBtn = document.getElementById('btn-remove-symbol');
  if (removeBtn) removeBtn.style.display = 'none';

  Utils.showToast(`Selected "${sym.name}" symbol.`, 'info');
}

/**
 * Set up File Upload & FileReader for Candidate Photo & Symbol
 */
function setupFileUploadListeners() {
  // Candidate Photo File Input
  const photoFileInput = document.getElementById('candidate-photo-file');
  const photoPreview = document.getElementById('candidate-photo-preview');
  const removePhotoBtn = document.getElementById('btn-remove-photo');

  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate format
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        Utils.showToast('Please upload a valid image file (PNG, JPG, JPEG, WEBP).', 'error');
        photoFileInput.value = '';
        return;
      }

      // Max size: 2MB for localStorage capacity
      if (file.size > 2 * 1024 * 1024) {
        Utils.showToast('Image file size must be less than 2MB.', 'error');
        photoFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        currentUploadedPhotoBase64 = loadEvent.target.result;
        if (photoPreview) photoPreview.src = currentUploadedPhotoBase64;
        if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
        Utils.showToast('Photo uploaded and preview ready.', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      currentUploadedPhotoBase64 = null;
      if (photoPreview) photoPreview.src = '../assets/images/default-avatar.svg';
      if (photoFileInput) photoFileInput.value = '';
      removePhotoBtn.style.display = 'none';
      Utils.showToast('Photo removed, default avatar restored.', 'info');
    });
  }

  // Candidate Symbol File Input
  const symbolFileInput = document.getElementById('candidate-symbol-file');
  const symbolPreview = document.getElementById('candidate-symbol-preview');
  const removeSymbolBtn = document.getElementById('btn-remove-symbol');

  if (symbolFileInput) {
    symbolFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        Utils.showToast('Please upload a valid image file (PNG, JPG, JPEG, WEBP).', 'error');
        symbolFileInput.value = '';
        return;
      }

      if (file.size > 1.5 * 1024 * 1024) {
        Utils.showToast('Symbol file size must be under 1.5MB.', 'error');
        symbolFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        currentUploadedSymbolBase64 = loadEvent.target.result;
        currentSelectedPresetSymbol = null;
        if (symbolPreview) symbolPreview.src = currentUploadedSymbolBase64;
        if (removeSymbolBtn) removeSymbolBtn.style.display = 'inline-block';

        const nameInput = document.getElementById('candidate-symbol-name-input');
        if (nameInput && !nameInput.value) {
          nameInput.value = file.name.replace(/\.[^/.]+$/, "");
        }
        Utils.showToast('Custom symbol uploaded successfully.', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeSymbolBtn) {
    removeSymbolBtn.addEventListener('click', () => {
      selectPresetSymbol(PRESET_SYMBOLS[0]);
    });
  }
}

function populateDropdownFilters() {
  const elections = Storage.getData('elections', []);
  const elecFilter = document.getElementById('candidate-election-filter');
  const modalElecSelect = document.getElementById('candidate-election-select');

  if (elecFilter) {
    elecFilter.innerHTML = '<option value="">All Elections</option>';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = elec.title || elec.name;
      elecFilter.appendChild(opt);
    });
  }

  if (modalElecSelect) {
    modalElecSelect.innerHTML = '';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = `${elec.title || elec.name} (${elec.status})`;
      if (elec.status === 'Active') opt.selected = true;
      modalElecSelect.appendChild(opt);
    });

    modalElecSelect.addEventListener('change', () => {
      populatePostDropdowns(modalElecSelect.value);
    });
  }

  populatePostDropdowns(modalElecSelect?.value || elections[0]?.id);
}

function populatePostDropdowns(electionId) {
  const allPosts = Storage.getData('posts', []);
  const posts = electionId ? allPosts.filter(p => p.electionId === electionId) : allPosts;

  const postFilter = document.getElementById('candidate-post-filter');
  const modalPostSelect = document.getElementById('candidate-post-select');

  if (postFilter) {
    const curVal = postFilter.value;
    postFilter.innerHTML = '<option value="">All Electoral Posts</option>';
    allPosts.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === curVal) opt.selected = true;
      postFilter.appendChild(opt);
    });
  }

  if (modalPostSelect) {
    modalPostSelect.innerHTML = '';
    posts.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      modalPostSelect.appendChild(opt);
    });
  }
}

function loadCandidates() {
  currentCandidatesList = Storage.getData('candidates', []);
  filterAndRenderCandidates();
}

/**
 * Filter and render candidates in professional cards (Section 11 layout)
 */
function filterAndRenderCandidates() {
  const query = (document.getElementById('candidate-search-input')?.value || '').toLowerCase().trim();
  const elecFilter = document.getElementById('candidate-election-filter')?.value || '';
  const postFilter = document.getElementById('candidate-post-filter')?.value || '';
  const statusFilter = document.getElementById('candidate-status-filter')?.value || '';

  const posts = Storage.getData('posts', []);
  const elections = Storage.getData('elections', []);

  const filtered = currentCandidatesList.filter(cand => {
    const post = posts.find(p => p.id === cand.postId);
    const postName = post ? post.name.toLowerCase() : '';
    const candName = (cand.name || '').toLowerCase();
    const candId = (cand.id || '').toLowerCase();
    const desc = (cand.description || '').toLowerCase();

    const matchesQuery = !query ||
      candName.includes(query) ||
      candId.includes(query) ||
      postName.includes(query) ||
      desc.includes(query);

    const matchesElec = !elecFilter || cand.electionId === elecFilter;
    const matchesPost = !postFilter || cand.postId === postFilter;
    const matchesStatus = !statusFilter || cand.status === statusFilter;

    return matchesQuery && matchesElec && matchesPost && matchesStatus;
  });

  const grid = document.getElementById('candidates-grid');
  const countDisplay = document.getElementById('candidate-count-display');
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${currentCandidatesList.length} candidates`;
  }

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: var(--radius-md); border: 1px dashed var(--slate-300);">
        <p style="color: var(--slate-500); font-size: 1rem; margin-bottom: 1rem;">No candidates match your search filter.</p>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('btn-open-add-candidate').click()">
          Add First Candidate
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(cand => {
    const post = posts.find(p => p.id === cand.postId);
    const postName = post ? post.name : (cand.postId || 'Unassigned Post');
    const elec = elections.find(e => e.id === cand.electionId);
    const elecTitle = elec ? (elec.title || elec.name) : 'Council Election';

    // Photo Source: either DataURL base64 or relative asset path
    let photoSrc = '../assets/images/default-avatar.svg';
    if (cand.photo) {
      photoSrc = cand.photo.startsWith('data:') ? cand.photo : `../${cand.photo}`;
    }

    // Symbol Source: either DataURL base64 or relative asset path
    let symbolSrc = '../assets/symbols/torch.svg';
    if (cand.symbolPath) {
      symbolSrc = cand.symbolPath.startsWith('data:') ? cand.symbolPath : `../${cand.symbolPath}`;
    }

    const statusBadge = cand.status === 'Active' ? 'badge-success' : 'badge-neutral';

    html += `
      <div class="card candidate-admin-card" style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--slate-200); transition: transform 0.2s, box-shadow 0.2s;">
        <!-- Card Top: Candidate Photo & Symbol Overlay (Section 11) -->
        <div style="background: linear-gradient(135deg, var(--slate-100) 0%, var(--slate-200) 100%); padding: 1.5rem 1rem; text-align: center; position: relative;">
          <!-- Candidate Photo -->
          <div style="width: 100px; height: 100px; margin: 0 auto; border-radius: 50%; overflow: hidden; border: 3px solid var(--white); box-shadow: var(--shadow-md); background: var(--white);">
            <img src="${photoSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="${Utils.escapeHtml(cand.name)}" onerror="this.src='../assets/images/default-avatar.svg'">
          </div>

          <!-- Candidate Symbol Badge Overlay -->
          <div style="position: absolute; bottom: 0.75rem; right: 1rem; width: 42px; height: 42px; border-radius: var(--radius-sm); background: var(--white); border: 2px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; padding: 4px;" title="Official Symbol: ${Utils.escapeHtml(cand.symbolName || 'Electoral Symbol')}">
            <img src="${symbolSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${Utils.escapeHtml(cand.symbolName || 'Symbol')}">
          </div>

          <!-- Status badge top-left -->
          <span class="badge ${statusBadge}" style="position: absolute; top: 0.75rem; left: 0.75rem;">
            ${Utils.escapeHtml(cand.status || 'Active')}
          </span>
        </div>

        <!-- Card Body -->
        <div style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--slate-900); margin: 0;">${Utils.escapeHtml(cand.name)}</h3>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 0.15rem 0.4rem; border-radius: var(--radius-sm);">
              ${Utils.escapeHtml(cand.id)}
            </span>
          </div>

          <!-- Post & Election -->
          <div style="margin-bottom: 0.75rem;">
            <span class="badge badge-primary" style="font-size: 0.8rem; margin-bottom: 0.25rem;">
              ${Utils.escapeHtml(postName)}
            </span>
            <div style="font-size: 0.75rem; color: var(--slate-500);">${Utils.escapeHtml(elecTitle)}</div>
            ${cand.department ? `<div style="font-size: 0.75rem; color: var(--slate-600); font-weight: 500;">Dept: ${Utils.escapeHtml(cand.department)}</div>` : ''}
          </div>

          <!-- Description / Manifesto -->
          <p style="font-size: 0.85rem; color: var(--slate-600); line-height: 1.5; margin-bottom: 1.25rem; flex: 1;">
            ${Utils.escapeHtml(cand.description || 'No campaign manifesto provided.')}
          </p>

          <!-- Action Buttons: [Edit] [Delete] [Status Toggle] (Section 11) -->
          <div style="display: flex; gap: 0.4rem; border-top: 1px solid var(--slate-100); padding-top: 1rem; margin-top: auto;">
            <button type="button" class="btn btn-sm btn-secondary" style="flex: 1;" onclick="editCandidate('${cand.id}')">
              Edit
            </button>
            <button type="button" class="btn btn-sm ${cand.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="toggleCandidateStatus('${cand.id}')" title="Toggle status">
              ${cand.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="openDeleteCandidateModal('${cand.id}')">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

/**
 * Handle Add/Edit Candidate Form Submission
 */
function handleCandidateFormSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById('candidate-form-mode').value;
  const originalId = document.getElementById('candidate-original-id').value;

  const candidateId = document.getElementById('candidate-id-input').value.trim();
  const name = document.getElementById('candidate-name-input').value.trim();
  const electionId = document.getElementById('candidate-election-select').value;
  const postId = document.getElementById('candidate-post-select').value;
  const symbolName = document.getElementById('candidate-symbol-name-input').value.trim() || 'Electoral Symbol';
  const department = document.getElementById('candidate-dept-input').value.trim();
  const status = document.getElementById('candidate-status-select').value;
  const description = document.getElementById('candidate-desc-input').value.trim();

  // Validations
  if (!candidateId) {
    Utils.showToast('Please enter a Candidate ID.', 'error');
    document.getElementById('candidate-id-input').focus();
    return;
  }

  if (!name) {
    Utils.showToast('Please enter the Candidate Name.', 'error');
    document.getElementById('candidate-name-input').focus();
    return;
  }

  if (!electionId) {
    Utils.showToast('Please assign an election campaign.', 'error');
    return;
  }

  if (!postId) {
    Utils.showToast('Please assign an electoral post / position.', 'error');
    return;
  }

  const candidates = Storage.getData('candidates', []);
  const existing = candidates.find(c => c.id.toLowerCase() === candidateId.toLowerCase());

  if (mode === 'add' && existing) {
    Utils.showToast('Candidate ID already exists. Please choose a unique ID.', 'error');
    document.getElementById('candidate-id-input').focus();
    return;
  }

  if (mode === 'edit' && existing && existing.id !== originalId) {
    Utils.showToast('Candidate ID already belongs to another candidate.', 'error');
    document.getElementById('candidate-id-input').focus();
    return;
  }

  // Determine Symbol Path: custom Base64 uploaded or preset
  let symbolPath = currentUploadedSymbolBase64 || currentSelectedPresetSymbol?.path || 'assets/symbols/torch.svg';
  let symbolKey = currentSelectedPresetSymbol?.id || 'custom';

  // Determine Photo: custom Base64 uploaded or default
  let photo = currentUploadedPhotoBase64 || 'assets/images/default-avatar.svg';

  if (mode === 'add') {
    const newCandidate = {
      id: candidateId,
      name,
      postId,
      electionId,
      symbol: symbolKey,
      symbolName,
      symbolPath,
      photo,
      description,
      department,
      status
    };

    Storage.appendData('candidates', newCandidate);
    Storage.addLog('Candidate Added', `Admin added candidate ${name} (${candidateId}) for post ${postId}.`, 'admin');
    Utils.showToast(`Candidate ${name} added successfully!`, 'success');
  } else {
    // Mode: Edit
    const existingCand = candidates.find(c => c.id === originalId);

    // If no new photo was uploaded, keep existing photo
    if (!currentUploadedPhotoBase64 && existingCand?.photo) {
      photo = existingCand.photo;
    }

    // If no new symbol was uploaded, keep existing symbol
    if (!currentUploadedSymbolBase64 && !currentSelectedPresetSymbol && existingCand?.symbolPath) {
      symbolPath = existingCand.symbolPath;
      symbolKey = existingCand.symbol || 'custom';
    }

    const updatedCandidate = {
      ...existingCand,
      id: candidateId,
      name,
      postId,
      electionId,
      symbol: symbolKey,
      symbolName,
      symbolPath,
      photo,
      description,
      department,
      status
    };

    Storage.updateData('candidates', originalId, updatedCandidate);
    Storage.addLog('Candidate Updated', `Admin updated candidate ${name} (${candidateId}).`, 'admin');
    Utils.showToast(`Candidate ${name} updated successfully!`, 'success');
  }

  Utils.closeModal('candidate-modal');
  loadCandidates();
}

/**
 * Open Edit Candidate Modal
 */
window.editCandidate = function(candidateId) {
  const candidates = Storage.getData('candidates', []);
  const cand = candidates.find(c => c.id === candidateId);
  if (!cand) return;

  resetCandidateForm();
  document.getElementById('modal-candidate-title').textContent = 'Edit Candidate';
  document.getElementById('candidate-form-mode').value = 'edit';
  document.getElementById('candidate-original-id').value = cand.id;

  const idInput = document.getElementById('candidate-id-input');
  idInput.value = cand.id;
  idInput.setAttribute('readonly', 'true');

  document.getElementById('candidate-name-input').value = cand.name || '';
  document.getElementById('candidate-symbol-name-input').value = cand.symbolName || '';
  document.getElementById('candidate-dept-input').value = cand.department || '';
  document.getElementById('candidate-status-select').value = cand.status || 'Active';
  document.getElementById('candidate-desc-input').value = cand.description || '';

  // Select Election & Posts
  const elecSelect = document.getElementById('candidate-election-select');
  if (elecSelect && cand.electionId) {
    elecSelect.value = cand.electionId;
    populatePostDropdowns(cand.electionId);
  }

  const postSelect = document.getElementById('candidate-post-select');
  if (postSelect && cand.postId) {
    postSelect.value = cand.postId;
  }

  // Photo preview
  const photoPreview = document.getElementById('candidate-photo-preview');
  const removePhotoBtn = document.getElementById('btn-remove-photo');
  if (photoPreview) {
    if (cand.photo) {
      photoPreview.src = cand.photo.startsWith('data:') ? cand.photo : `../${cand.photo}`;
      if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
    } else {
      photoPreview.src = '../assets/images/default-avatar.svg';
      if (removePhotoBtn) removePhotoBtn.style.display = 'none';
    }
  }

  // Symbol preview
  const symbolPreview = document.getElementById('candidate-symbol-preview');
  const removeSymbolBtn = document.getElementById('btn-remove-symbol');
  if (symbolPreview) {
    if (cand.symbolPath) {
      symbolPreview.src = cand.symbolPath.startsWith('data:') ? cand.symbolPath : `../${cand.symbolPath}`;
      if (removeSymbolBtn) removeSymbolBtn.style.display = 'inline-block';
    } else {
      symbolPreview.src = '../assets/symbols/torch.svg';
    }
  }

  currentUploadedPhotoBase64 = null;
  currentUploadedSymbolBase64 = null;

  Utils.openModal('candidate-modal');
};

/**
 * Toggle Active / Inactive
 */
window.toggleCandidateStatus = function(candidateId) {
  const candidates = Storage.getData('candidates', []);
  const cand = candidates.find(c => c.id === candidateId);
  if (!cand) return;

  const newStatus = cand.status === 'Active' ? 'Inactive' : 'Active';
  Storage.updateData('candidates', candidateId, { status: newStatus });
  Storage.addLog('Candidate Status Changed', `Candidate ${candidateId} set to ${newStatus}.`, 'admin');
  Utils.showToast(`Candidate status set to ${newStatus}.`, 'info');
  loadCandidates();
};

/**
 * Open Delete Candidate Modal
 */
window.openDeleteCandidateModal = function(candidateId) {
  const candidates = Storage.getData('candidates', []);
  const cand = candidates.find(c => c.id === candidateId);
  if (!cand) return;

  candidateToDeleteId = candidateId;
  document.getElementById('delete-cand-name-display').textContent = cand.name;
  document.getElementById('delete-cand-id-display').textContent = cand.id;

  Utils.openModal('delete-candidate-modal');
};

/**
 * Execute Candidate Deletion
 */
function handleConfirmDeleteCandidate() {
  if (!candidateToDeleteId) return;

  const candidates = Storage.getData('candidates', []);
  const cand = candidates.find(c => c.id === candidateToDeleteId);
  const cName = cand ? cand.name : candidateToDeleteId;

  Storage.deleteData('candidates', candidateToDeleteId);
  Storage.addLog('Candidate Deleted', `Admin deleted candidate ${cName} (${candidateToDeleteId}).`, 'admin');
  Utils.showToast(`Candidate ${cName} was deleted.`, 'info');

  candidateToDeleteId = null;
  Utils.closeModal('delete-candidate-modal');
  loadCandidates();
}

function resetCandidateForm() {
  const form = document.getElementById('candidate-form');
  if (form) form.reset();

  currentUploadedPhotoBase64 = null;
  currentUploadedSymbolBase64 = null;
  currentSelectedPresetSymbol = PRESET_SYMBOLS[0];

  const photoPreview = document.getElementById('candidate-photo-preview');
  if (photoPreview) photoPreview.src = '../assets/images/default-avatar.svg';

  const symbolPreview = document.getElementById('candidate-symbol-preview');
  if (symbolPreview) symbolPreview.src = `../${PRESET_SYMBOLS[0].path}`;

  const removePhotoBtn = document.getElementById('btn-remove-photo');
  if (removePhotoBtn) removePhotoBtn.style.display = 'none';

  const removeSymbolBtn = document.getElementById('btn-remove-symbol');
  if (removeSymbolBtn) removeSymbolBtn.style.display = 'none';

  const symbolFileInput = document.getElementById('candidate-symbol-file');
  if (symbolFileInput) symbolFileInput.value = '';

  const photoFileInput = document.getElementById('candidate-photo-file');
  if (photoFileInput) photoFileInput.value = '';
}
