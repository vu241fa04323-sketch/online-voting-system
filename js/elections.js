/**
 * VoteSecure - Election Lifecycle & Campaign Controller
 * Handles Election creation, editing, start, stop, delete, and schedule validation.
 */

let currentElectionsList = [];
let electionToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initElectionsManagement();
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

function initElectionsManagement() {
  loadElections();

  // Search input
  const searchInput = document.getElementById('election-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderElections());
  }

  // Status filter
  const statusFilter = document.getElementById('election-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => filterAndRenderElections());
  }

  // Create Election button
  const openAddBtn = document.getElementById('btn-open-add-election');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      resetElectionForm();
      document.getElementById('modal-election-title').textContent = 'Create Election';
      document.getElementById('election-form-mode').value = 'add';
      document.getElementById('election-original-id').value = '';

      const idInput = document.getElementById('election-id-input');
      idInput.removeAttribute('readonly');
      idInput.value = '';

      // Default dates: today and 14 days later
      const today = new Date().toISOString().split('T')[0];
      const nextFortnight = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      document.getElementById('election-start-date').value = today;
      document.getElementById('election-end-date').value = nextFortnight;
      document.getElementById('election-start-time').value = '09:00';
      document.getElementById('election-end-time').value = '17:00';

      Utils.openModal('election-modal');
    });
  }

  // Form submit
  const form = document.getElementById('election-form');
  if (form) {
    form.addEventListener('submit', handleElectionFormSubmit);
  }

  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete-election');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleConfirmDeleteElection);
  }

  // Modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', function() {
      const target = this.getAttribute('data-close-modal');
      Utils.closeModal(target);
    });
  });
}

function loadElections() {
  currentElectionsList = Storage.getData('elections', []);
  filterAndRenderElections();
}

function filterAndRenderElections() {
  const query = (document.getElementById('election-search-input')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('election-status-filter')?.value || '';

  const posts = Storage.getData('posts', []);
  const candidates = Storage.getData('candidates', []);
  const votes = Storage.getData('votes', []);

  const filtered = currentElectionsList.filter(elec => {
    const title = (elec.title || elec.name || '').toLowerCase();
    const id = (elec.id || '').toLowerCase();
    const desc = (elec.description || '').toLowerCase();

    const matchesQuery = !query || title.includes(query) || id.includes(query) || desc.includes(query);
    const matchesStatus = !statusFilter || elec.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const grid = document.getElementById('elections-grid');
  const countDisplay = document.getElementById('election-count-display');
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${currentElectionsList.length} elections`;
  }

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: var(--radius-md); border: 1px dashed var(--slate-300);">
        <p style="color: var(--slate-500); font-size: 1rem; margin-bottom: 1rem;">No elections match your filter.</p>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('btn-open-add-election').click()">
          Create New Election
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(elec => {
    const elecPosts = posts.filter(p => p.electionId === elec.id);
    const elecCands = candidates.filter(c => c.electionId === elec.id);
    const elecVotes = votes.filter(v => v.electionId === elec.id);

    let statusBadgeClass = 'badge-neutral';
    if (elec.status === 'Active') statusBadgeClass = 'badge-success';
    else if (elec.status === 'Upcoming') statusBadgeClass = 'badge-primary';

    // Format Start & End schedule
    const startStr = `${Utils.formatDate(elec.startDate)} at ${elec.startTime || '09:00 AM'}`;
    const endStr = `${Utils.formatDate(elec.endDate)} at ${elec.endTime || '05:00 PM'}`;

    html += `
      <div class="card election-card" style="display: flex; flex-direction: column; border: 1px solid var(--slate-200); position: relative;">
        <div class="card-header" style="padding-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span class="badge ${statusBadgeClass}">
                ${elec.status === 'Active' ? '<span class="badge-dot"></span>' : ''} ${Utils.escapeHtml(elec.status)}
              </span>
              <span style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: var(--slate-500);">
                ${Utils.escapeHtml(elec.id)}
              </span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--slate-900); margin: 0;">
              ${Utils.escapeHtml(elec.title || elec.name)}
            </h3>
          </div>
        </div>

        <div class="card-body" style="flex: 1; display: flex; flex-direction: column; padding-top: 0.5rem;">
          <p style="font-size: 0.88rem; color: var(--slate-600); line-height: 1.5; margin-bottom: 1.25rem;">
            ${Utils.escapeHtml(elec.description || 'No description provided.')}
          </p>

          <!-- Timeline Schedule Box -->
          <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.82rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span style="color: var(--slate-500); font-weight: 600;">Start:</span>
              <span style="font-weight: 600; color: var(--slate-800);">${startStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--slate-500); font-weight: 600;">End:</span>
              <span style="font-weight: 600; color: var(--slate-800);">${endStr}</span>
            </div>
          </div>

          <!-- Quick Stats Pills -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 1.25rem;">
            <div style="background: var(--slate-100); border-radius: var(--radius-sm); padding: 0.5rem;">
              <div style="font-size: 0.7rem; color: var(--slate-500); text-transform: uppercase;">Posts</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--slate-900);">${elecPosts.length}</div>
            </div>
            <div style="background: var(--slate-100); border-radius: var(--radius-sm); padding: 0.5rem;">
              <div style="font-size: 0.7rem; color: var(--slate-500); text-transform: uppercase;">Candidates</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--slate-900);">${elecCands.length}</div>
            </div>
            <div style="background: var(--slate-100); border-radius: var(--radius-sm); padding: 0.5rem;">
              <div style="font-size: 0.7rem; color: var(--slate-500); text-transform: uppercase;">Votes Cast</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent);">${elecVotes.length}</div>
            </div>
          </div>

          <!-- Admin Controls (Section 14) -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; border-top: 1px solid var(--slate-100); padding-top: 1rem;">
            <div style="display: flex; gap: 0.5rem;">
              ${elec.status !== 'Active' ? `
                <button type="button" class="btn btn-sm btn-accent" style="flex: 1;" onclick="startElection('${elec.id}')" title="Open election for voter ballots">
                  ▶ Start Election
                </button>
              ` : `
                <button type="button" class="btn btn-sm btn-outline-warning" style="flex: 1;" onclick="stopElection('${elec.id}')" title="Close voting and mark completed">
                  ⏹ Stop Election
                </button>
              `}
              <button type="button" class="btn btn-sm btn-secondary" onclick="editElection('${elec.id}')">
                Edit
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="openDeleteElectionModal('${elec.id}')">
                Delete
              </button>
            </div>

            <!-- Management Links -->
            <div style="display: flex; gap: 0.4rem; justify-content: center; font-size: 0.8rem; margin-top: 0.25rem;">
              <a href="posts.html?electionId=${encodeURIComponent(elec.id)}" style="color: var(--primary); font-weight: 600;">Posts (${elecPosts.length})</a>
              <span style="color: var(--slate-300);">&bull;</span>
              <a href="candidates.html?electionId=${encodeURIComponent(elec.id)}" style="color: var(--primary); font-weight: 600;">Candidates (${elecCands.length})</a>
              <span style="color: var(--slate-300);">&bull;</span>
              <a href="results.html?electionId=${encodeURIComponent(elec.id)}" style="color: var(--accent); font-weight: 600;">View Results &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function handleElectionFormSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById('election-form-mode').value;
  const originalId = document.getElementById('election-original-id').value;

  const id = document.getElementById('election-id-input').value.trim();
  const name = document.getElementById('election-name-input').value.trim();
  const description = document.getElementById('election-desc-input').value.trim();
  const startDate = document.getElementById('election-start-date').value;
  const startTime = document.getElementById('election-start-time').value || '09:00';
  const endDate = document.getElementById('election-end-date').value;
  const endTime = document.getElementById('election-end-time').value || '17:00';
  const status = document.getElementById('election-status-input').value;

  // Validation (Section 33)
  if (!id) {
    Utils.showToast('Please enter an Election ID.', 'error');
    document.getElementById('election-id-input').focus();
    return;
  }

  if (!name) {
    Utils.showToast('Please enter the Election Name.', 'error');
    document.getElementById('election-name-input').focus();
    return;
  }

  if (!startDate) {
    Utils.showToast('Please select a start date.', 'error');
    document.getElementById('election-start-date').focus();
    return;
  }

  if (!endDate) {
    Utils.showToast('Please select an end date.', 'error');
    document.getElementById('election-end-date').focus();
    return;
  }

  // End date must be after start date
  const startFull = new Date(`${startDate}T${startTime}`);
  const endFull = new Date(`${endDate}T${endTime}`);

  if (endFull <= startFull) {
    Utils.showToast('End date and time must be after start date and time.', 'error');
    document.getElementById('election-end-date').focus();
    return;
  }

  const elections = Storage.getData('elections', []);
  const existing = elections.find(el => el.id.toLowerCase() === id.toLowerCase());

  if (mode === 'add' && existing) {
    Utils.showToast('Election ID already exists. Please choose a unique ID.', 'error');
    document.getElementById('election-id-input').focus();
    return;
  }

  if (mode === 'edit' && existing && existing.id !== originalId) {
    Utils.showToast('Election ID already belongs to another election.', 'error');
    document.getElementById('election-id-input').focus();
    return;
  }

  if (mode === 'add') {
    const newElection = {
      id,
      name,
      title: name,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      status,
      createdAt: new Date().toISOString()
    };

    Storage.appendData('elections', newElection);
    Storage.addLog('Election Created', `Admin created election "${name}" (${id}).`, 'admin');
    Utils.showToast(`Election "${name}" created successfully!`, 'success');
  } else {
    // Mode: Edit
    const existingElec = elections.find(el => el.id === originalId);
    const updated = {
      ...existingElec,
      id,
      name,
      title: name,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      status
    };

    Storage.updateData('elections', originalId, updated);
    Storage.addLog('Election Updated', `Admin updated election "${name}" (${id}).`, 'admin');
    Utils.showToast(`Election "${name}" updated successfully!`, 'success');
  }

  Utils.closeModal('election-modal');
  loadElections();
}

/**
 * Start Election (Section 14: Start election sets status to Active)
 */
window.startElection = function(electionId) {
  const elections = Storage.getData('elections', []);
  const elec = elections.find(e => e.id === electionId);
  if (!elec) return;

  Storage.updateData('elections', electionId, { status: 'Active' });
  Storage.saveData('currentElection', electionId);
  Storage.addLog('Election Started', `Admin started election "${elec.title || elec.name}" (${electionId}).`, 'admin');
  Utils.showToast(`Election "${elec.title || elec.name}" is now Active and open for voting!`, 'success');
  loadElections();
};

/**
 * Stop Election (Section 14: Stop election sets status to Completed)
 */
window.stopElection = function(electionId) {
  const elections = Storage.getData('elections', []);
  const elec = elections.find(e => e.id === electionId);
  if (!elec) return;

  Storage.updateData('elections', electionId, { status: 'Completed' });
  Storage.addLog('Election Stopped', `Admin stopped election "${elec.title || elec.name}" (${electionId}).`, 'admin');
  Utils.showToast(`Election "${elec.title || elec.name}" is now marked Completed.`, 'info');
  loadElections();
};

/**
 * Open Edit Election Modal
 */
window.editElection = function(electionId) {
  const elections = Storage.getData('elections', []);
  const elec = elections.find(e => e.id === electionId);
  if (!elec) return;

  resetElectionForm();
  document.getElementById('modal-election-title').textContent = 'Edit Election';
  document.getElementById('election-form-mode').value = 'edit';
  document.getElementById('election-original-id').value = elec.id;

  const idInput = document.getElementById('election-id-input');
  idInput.value = elec.id;
  idInput.setAttribute('readonly', 'true');

  document.getElementById('election-name-input').value = elec.title || elec.name || '';
  document.getElementById('election-desc-input').value = elec.description || '';
  document.getElementById('election-start-date').value = elec.startDate || '';
  document.getElementById('election-start-time').value = elec.startTime || '09:00';
  document.getElementById('election-end-date').value = elec.endDate || '';
  document.getElementById('election-end-time').value = elec.endTime || '17:00';
  document.getElementById('election-status-input').value = elec.status || 'Active';

  Utils.openModal('election-modal');
};

/**
 * Open Delete Election Modal
 */
window.openDeleteElectionModal = function(electionId) {
  const elections = Storage.getData('elections', []);
  const elec = elections.find(e => e.id === electionId);
  if (!elec) return;

  electionToDeleteId = electionId;
  document.getElementById('delete-elec-title-display').textContent = elec.title || elec.name;
  document.getElementById('delete-elec-id-display').textContent = elec.id;

  Utils.openModal('delete-election-modal');
};

/**
 * Execute Election Deletion
 */
function handleConfirmDeleteElection() {
  if (!electionToDeleteId) return;

  const elections = Storage.getData('elections', []);
  const elec = elections.find(e => e.id === electionToDeleteId);
  const name = elec ? (elec.title || elec.name) : electionToDeleteId;

  Storage.deleteData('elections', electionToDeleteId);
  Storage.addLog('Election Deleted', `Admin deleted election "${name}" (${electionToDeleteId}).`, 'admin');
  Utils.showToast(`Election "${name}" deleted.`, 'info');

  electionToDeleteId = null;
  Utils.closeModal('delete-election-modal');
  loadElections();
}

function resetElectionForm() {
  const form = document.getElementById('election-form');
  if (form) form.reset();
}
