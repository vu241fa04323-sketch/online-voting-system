/**
 * VoteSecure - Voter Management Controller
 * Handles full voter CRUD, validation, search, filter, status toggle, details modal, and confirmation.
 */

let currentVotersList = [];
let voterToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initVoterManagement();
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

function initVoterManagement() {
  loadVotersTable();

  // Search input: User ID, Name, Student ID, Department
  const searchInput = document.getElementById('voter-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderVoters());
  }

  // Department filter
  const deptFilter = document.getElementById('voter-department-filter');
  if (deptFilter) {
    deptFilter.addEventListener('change', () => filterAndRenderVoters());
  }

  // Status filter
  const statusFilter = document.getElementById('voter-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => filterAndRenderVoters());
  }

  // Add Voter Modal trigger
  const openAddBtn = document.getElementById('btn-open-add-voter');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      resetVoterForm();
      document.getElementById('modal-voter-title').textContent = 'Add Voter';
      document.getElementById('voter-form-mode').value = 'add';
      document.getElementById('voter-original-id').value = '';
      
      const idInput = document.getElementById('voter-id-input');
      idInput.removeAttribute('readonly');
      idInput.value = '';
      
      // Password is required in add mode
      document.getElementById('voter-password-input').required = true;
      document.getElementById('voter-confirm-password-input').required = true;
      document.getElementById('voter-created-date').value = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      Utils.openModal('voter-modal');
    });
  }

  // Voter form submit handler
  const voterForm = document.getElementById('voter-form');
  if (voterForm) {
    voterForm.addEventListener('submit', handleVoterFormSubmit);
  }

  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete-voter');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  }

  // Modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', function() {
      const target = this.getAttribute('data-close-modal');
      Utils.closeModal(target);
    });
  });
}

function loadVotersTable() {
  currentVotersList = Storage.getData('voters', []);
  populateDepartmentOptions();
  filterAndRenderVoters();
}

/**
 * Populate department dropdown filter dynamically
 */
function populateDepartmentOptions() {
  const deptSelect = document.getElementById('voter-department-filter');
  if (!deptSelect) return;

  const currentVal = deptSelect.value;
  const departments = [...new Set(currentVotersList.map(v => v.department).filter(Boolean))].sort();

  deptSelect.innerHTML = '<option value="">All Departments</option>';
  departments.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    if (dept === currentVal) opt.selected = true;
    deptSelect.appendChild(opt);
  });
}

/**
 * Filter, sort, and render voter table rows
 */
function filterAndRenderVoters() {
  const query = (document.getElementById('voter-search-input')?.value || '').toLowerCase().trim();
  const deptFilter = document.getElementById('voter-department-filter')?.value || '';
  const statusFilter = document.getElementById('voter-status-filter')?.value || '';

  const filtered = currentVotersList.filter(voter => {
    const vId = (voter.userId || voter.id || '').toLowerCase();
    const vName = (voter.fullName || voter.name || '').toLowerCase();
    const vStudentId = (voter.studentId || '').toLowerCase();
    const vDept = (voter.department || '').toLowerCase();
    const vEmail = (voter.email || '').toLowerCase();

    const matchesQuery = !query || 
      vId.includes(query) ||
      vName.includes(query) ||
      vStudentId.includes(query) ||
      vDept.includes(query) ||
      vEmail.includes(query);

    const matchesDept = !deptFilter || voter.department === deptFilter;
    const matchesStatus = !statusFilter || voter.status === statusFilter;

    return matchesQuery && matchesDept && matchesStatus;
  });

  const tbody = document.getElementById('voters-table-body');
  const countDisplay = document.getElementById('voter-count-display');
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${currentVotersList.length} voters`;
  }

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          No voters found matching your criteria.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(voter => {
    const userId = voter.userId || voter.id;
    const name = voter.fullName || voter.name;
    const studentId = voter.studentId || '—';
    const dept = voter.department || '—';
    const email = voter.email || '—';
    const phone = voter.phone || '—';
    const status = voter.status || 'Active';
    const statusBadge = status === 'Active' ? 'badge-success' : 'badge-neutral';

    html += `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(userId)}</td>
        <td style="font-weight: 600; color: var(--slate-900);">${Utils.escapeHtml(name)}</td>
        <td>${Utils.escapeHtml(studentId)}</td>
        <td>${Utils.escapeHtml(dept)}</td>
        <td>${Utils.escapeHtml(email)}</td>
        <td>${Utils.escapeHtml(phone)}</td>
        <td><span class="badge ${statusBadge}">${Utils.escapeHtml(status)}</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="viewVoterDetails('${voter.id}')" title="View Voter Details">
              View
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="editVoter('${voter.id}')" title="Edit Voter">
              Edit
            </button>
            <button type="button" class="btn btn-sm ${status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="toggleVoterStatus('${voter.id}')" title="Toggle Active/Inactive">
              ${status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="openDeleteVoterModal('${voter.id}')" title="Delete Voter">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Handle Add/Edit form submission with complete validation
 */
function handleVoterFormSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById('voter-form-mode').value;
  const originalId = document.getElementById('voter-original-id').value;

  const userId = document.getElementById('voter-id-input').value.trim();
  const password = document.getElementById('voter-password-input').value;
  const confirmPassword = document.getElementById('voter-confirm-password-input').value;
  const fullName = document.getElementById('voter-name-input').value.trim();
  const dateOfBirth = document.getElementById('voter-dob-input').value;
  const gender = document.getElementById('voter-gender-input').value;
  const email = document.getElementById('voter-email-input').value.trim();
  const phone = document.getElementById('voter-phone-input').value.trim();
  const address = document.getElementById('voter-address-input').value.trim();
  const studentId = document.getElementById('voter-student-id-input').value.trim();
  const department = document.getElementById('voter-dept-input').value.trim();
  const year = document.getElementById('voter-year-input').value.trim();
  const section = document.getElementById('voter-section-input').value.trim();
  const status = document.getElementById('voter-status-input').value;

  // Validation Checks
  if (!userId) {
    Utils.showToast('Please enter a User ID.', 'error');
    document.getElementById('voter-id-input').focus();
    return;
  }

  // Unique User ID check
  const voters = Storage.getData('voters', []);
  const existingVoter = voters.find(v => (v.id.toLowerCase() === userId.toLowerCase() || (v.userId && v.userId.toLowerCase() === userId.toLowerCase())));
  
  if (mode === 'add' && existingVoter) {
    Utils.showToast('User ID already exists. Please choose a unique User ID.', 'error');
    document.getElementById('voter-id-input').focus();
    return;
  }

  if (mode === 'edit' && existingVoter && existingVoter.id !== originalId) {
    Utils.showToast('User ID already exists on another account.', 'error');
    document.getElementById('voter-id-input').focus();
    return;
  }

  // Password validation
  if (mode === 'add') {
    if (!password) {
      Utils.showToast('Please enter a password.', 'error');
      document.getElementById('voter-password-input').focus();
      return;
    }
    if (password.length < 6) {
      Utils.showToast('Password must be at least 6 characters long.', 'error');
      document.getElementById('voter-password-input').focus();
      return;
    }
    if (password !== confirmPassword) {
      Utils.showToast('Passwords do not match.', 'error');
      document.getElementById('voter-confirm-password-input').focus();
      return;
    }
  } else if (mode === 'edit' && password) {
    if (password.length < 6) {
      Utils.showToast('New password must be at least 6 characters long.', 'error');
      document.getElementById('voter-password-input').focus();
      return;
    }
    if (password !== confirmPassword) {
      Utils.showToast('Passwords do not match.', 'error');
      document.getElementById('voter-confirm-password-input').focus();
      return;
    }
  }

  // Name validation
  if (!fullName) {
    Utils.showToast('Please enter the voter\'s full name.', 'error');
    document.getElementById('voter-name-input').focus();
    return;
  }

  // Email validation
  if (!email || !Utils.isValidEmail(email)) {
    Utils.showToast('Please enter a valid email address.', 'error');
    document.getElementById('voter-email-input').focus();
    return;
  }

  // Student/Employee ID validation
  if (!studentId) {
    Utils.showToast('Please enter Student / Employee ID.', 'error');
    document.getElementById('voter-student-id-input').focus();
    return;
  }

  // Department validation
  if (!department) {
    Utils.showToast('Please enter the department.', 'error');
    document.getElementById('voter-dept-input').focus();
    return;
  }

  if (mode === 'add') {
    const newVoter = {
      id: userId,
      userId: userId,
      password: password,
      fullName: fullName,
      name: fullName,
      dateOfBirth: dateOfBirth || '',
      gender: gender || 'Male',
      email: email,
      phone: phone || '',
      address: address || '',
      studentId: studentId,
      department: department,
      year: year || '',
      section: section || '',
      status: status || 'Active',
      createdAt: new Date().toISOString()
    };

    Storage.appendData('voters', newVoter);
    Storage.addLog('Voter Created', `Admin manually added voter ${userId} (${fullName}).`, 'admin');
    Utils.showToast(`Voter ${userId} added successfully!`, 'success');
  } else {
    // Mode: Edit
    const existing = voters.find(v => v.id === originalId);
    const updatedVoter = {
      ...existing,
      userId: userId,
      fullName: fullName,
      name: fullName,
      dateOfBirth: dateOfBirth,
      gender: gender,
      email: email,
      phone: phone,
      address: address,
      studentId: studentId,
      department: department,
      year: year,
      section: section,
      status: status
    };

    // If new password was entered, update password
    if (password) {
      updatedVoter.password = password;
    }

    Storage.updateData('voters', originalId, updatedVoter);
    Storage.addLog('Voter Updated', `Admin updated details for voter ${userId}.`, 'admin');
    Utils.showToast(`Voter ${userId} updated successfully!`, 'success');
  }

  Utils.closeModal('voter-modal');
  loadVotersTable();
}

/**
 * Open View Voter Details Modal
 */
window.viewVoterDetails = function(voterId) {
  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => v.id === voterId);
  if (!voter) return;

  const votes = Storage.getData('votes', []);
  const voterVotes = votes.filter(v => v.voterId === voter.id || v.userId === voter.id);
  const statusBadge = voter.status === 'Active' ? 'badge-success' : 'badge-neutral';

  const bodyEl = document.getElementById('view-voter-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--slate-200);">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem;">
        ${(voter.fullName || voter.name || 'V').substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h3 style="margin: 0; font-size: 1.25rem; color: var(--slate-900);">${Utils.escapeHtml(voter.fullName || voter.name)}</h3>
        <div style="font-family: var(--font-mono); color: var(--primary); font-weight: 700; font-size: 0.9rem;">
          User ID: ${Utils.escapeHtml(voter.userId || voter.id)}
        </div>
      </div>
      <div style="margin-left: auto;">
        <span class="badge ${statusBadge}">${Utils.escapeHtml(voter.status)}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.88rem;">
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Student / Employee ID</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.studentId || '—')}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Department</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.department || '—')}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Class / Year</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.year || '—')} (Sec: ${Utils.escapeHtml(voter.section || '—')})</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Gender / DOB</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.gender || '—')} / ${voter.dateOfBirth || '—'}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Email Address</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.email || '—')}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Phone Number</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.phone || '—')}</div>
      </div>
      <div style="grid-column: span 2;">
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Address</div>
        <div style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(voter.address || '—')}</div>
      </div>
      <div style="grid-column: span 2;">
        <div style="color: var(--slate-500); font-size: 0.75rem; text-transform: uppercase;">Account Created</div>
        <div style="font-weight: 500; color: var(--slate-600);">${voter.createdAt ? Utils.formatDateTime(voter.createdAt) : '—'}</div>
      </div>
    </div>

    <div style="border-top: 1px solid var(--slate-200); padding-top: 1rem;">
      <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--slate-900);">Voting Participation</h4>
      ${voterVotes.length > 0 ? `
        <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); padding: 0.75rem;">
          <div style="font-size: 0.85rem; color: var(--accent); font-weight: 700;">
            ✓ Ballot Cast (Confirmation: ${voterVotes[0].id})
          </div>
          <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 0.25rem;">
            Submitted on: ${Utils.formatDateTime(voterVotes[0].timestamp)}
          </div>
        </div>
      ` : `
        <div style="font-size: 0.85rem; color: var(--slate-500);">
          No ballot cast yet for active elections.
        </div>
      `}
    </div>
  `;

  Utils.openModal('view-voter-modal');
};

/**
 * Open Edit Voter Modal
 */
window.editVoter = function(voterId) {
  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => v.id === voterId);
  if (!voter) return;

  resetVoterForm();
  document.getElementById('modal-voter-title').textContent = 'Edit Voter Details';
  document.getElementById('voter-form-mode').value = 'edit';
  document.getElementById('voter-original-id').value = voter.id;

  const idInput = document.getElementById('voter-id-input');
  idInput.value = voter.userId || voter.id;
  idInput.setAttribute('readonly', 'true');

  // Passwords are optional in edit mode
  document.getElementById('voter-password-input').required = false;
  document.getElementById('voter-confirm-password-input').required = false;

  document.getElementById('voter-name-input').value = voter.fullName || voter.name || '';
  document.getElementById('voter-dob-input').value = voter.dateOfBirth || '';
  document.getElementById('voter-gender-input').value = voter.gender || 'Male';
  document.getElementById('voter-email-input').value = voter.email || '';
  document.getElementById('voter-phone-input').value = voter.phone || '';
  document.getElementById('voter-address-input').value = voter.address || '';
  document.getElementById('voter-student-id-input').value = voter.studentId || '';
  document.getElementById('voter-dept-input').value = voter.department || '';
  document.getElementById('voter-year-input').value = voter.year || '';
  document.getElementById('voter-section-input').value = voter.section || '';
  document.getElementById('voter-status-input').value = voter.status || 'Active';
  document.getElementById('voter-created-date').value = voter.createdAt ? Utils.formatDateTime(voter.createdAt) : 'Initial Demo Record';

  Utils.openModal('voter-modal');
};

/**
 * Quick toggle status between Active and Inactive
 */
window.toggleVoterStatus = function(voterId) {
  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => v.id === voterId);
  if (!voter) return;

  const newStatus = voter.status === 'Active' ? 'Inactive' : 'Active';
  Storage.updateData('voters', voterId, { status: newStatus });
  Storage.addLog('Voter Status Changed', `Voter ${voterId} status set to ${newStatus}.`, 'admin');
  Utils.showToast(`Voter status changed to ${newStatus}.`, 'info');
  loadVotersTable();
};

/**
 * Open Delete Voter Confirmation Modal
 */
window.openDeleteVoterModal = function(voterId) {
  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => v.id === voterId);
  if (!voter) return;

  voterToDeleteId = voterId;
  document.getElementById('delete-voter-name-display').textContent = voter.fullName || voter.name;
  document.getElementById('delete-voter-id-display').textContent = voter.userId || voter.id;

  Utils.openModal('delete-voter-modal');
};

/**
 * Execute Voter Deletion
 */
function handleConfirmDelete() {
  if (!voterToDeleteId) return;

  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => v.id === voterToDeleteId);
  const vName = voter ? (voter.fullName || voter.name) : voterToDeleteId;

  Storage.deleteData('voters', voterToDeleteId);
  Storage.addLog('Voter Deleted', `Admin deleted voter ${voterToDeleteId} (${vName}).`, 'admin');
  Utils.showToast(`Voter ${vName} was deleted.`, 'info');

  voterToDeleteId = null;
  Utils.closeModal('delete-voter-modal');
  loadVotersTable();
}

/**
 * Reset form fields
 */
function resetVoterForm() {
  const form = document.getElementById('voter-form');
  if (form) form.reset();
}
