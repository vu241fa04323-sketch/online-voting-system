/**
 * VoteSecure - Post / Position Management Controller
 * Handles CRUD operations, election assignment, and candidate linkage for electoral posts.
 */

let currentPostsList = [];
let postToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initPostManagement();
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

function initPostManagement() {
  populateElectionDropdowns();
  loadPostsTable();

  // Search input
  const searchInput = document.getElementById('post-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderPosts());
  }

  // Election filter
  const electionFilter = document.getElementById('post-election-filter');
  if (electionFilter) {
    electionFilter.addEventListener('change', () => filterAndRenderPosts());
  }

  // Add Post modal trigger
  const openAddBtn = document.getElementById('btn-open-add-post');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      resetPostForm();
      document.getElementById('modal-post-title').textContent = 'Add Electoral Post';
      document.getElementById('post-form-mode').value = 'add';
      document.getElementById('post-original-id').value = '';

      const idInput = document.getElementById('post-id-input');
      idInput.removeAttribute('readonly');
      idInput.value = '';

      // Suggest default order
      const posts = Storage.getData('posts', []);
      document.getElementById('post-order-input').value = posts.length + 1;

      Utils.openModal('post-modal');
    });
  }

  // Post form submit
  const postForm = document.getElementById('post-form');
  if (postForm) {
    postForm.addEventListener('submit', handlePostFormSubmit);
  }

  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete-post');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleConfirmDeletePost);
  }

  // Modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', function() {
      const target = this.getAttribute('data-close-modal');
      Utils.closeModal(target);
    });
  });
}

function populateElectionDropdowns() {
  const elections = Storage.getData('elections', []);
  const filterSelect = document.getElementById('post-election-filter');
  const modalSelect = document.getElementById('post-election-select');

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">All Elections</option>';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = elec.title || elec.name;
      filterSelect.appendChild(opt);
    });
  }

  if (modalSelect) {
    modalSelect.innerHTML = '';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = `${elec.title || elec.name} (${elec.status})`;
      if (elec.status === 'Active') opt.selected = true;
      modalSelect.appendChild(opt);
    });
  }
}

function loadPostsTable() {
  currentPostsList = Storage.getData('posts', []);
  filterAndRenderPosts();
}

function filterAndRenderPosts() {
  const query = (document.getElementById('post-search-input')?.value || '').toLowerCase().trim();
  const electionFilter = document.getElementById('post-election-filter')?.value || '';

  const elections = Storage.getData('elections', []);
  const candidates = Storage.getData('candidates', []);

  const filtered = currentPostsList.filter(post => {
    const matchesQuery = !query || 
      (post.name && post.name.toLowerCase().includes(query)) ||
      (post.description && post.description.toLowerCase().includes(query)) ||
      (post.id && post.id.toLowerCase().includes(query));

    const matchesElection = !electionFilter || post.electionId === electionFilter;

    return matchesQuery && matchesElection;
  });

  filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

  const tbody = document.getElementById('posts-table-body');
  const countDisplay = document.getElementById('post-count-display');
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${currentPostsList.length} posts`;
  }

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No electoral posts found. Click "Add Post" to create one.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(post => {
    const elec = elections.find(e => e.id === post.electionId);
    const postCandidates = candidates.filter(c => c.postId === post.id);

    let candidateBadges = '';
    if (postCandidates.length > 0) {
      candidateBadges = postCandidates.map(c => `
        <span class="badge ${c.status === 'Active' ? 'badge-primary' : 'badge-neutral'}" style="margin: 0.15rem 0.15rem 0.15rem 0; display: inline-block;">
          ${Utils.escapeHtml(c.name)}
        </span>
      `).join('');
    } else {
      candidateBadges = '<span style="color: var(--slate-400); font-size: 0.82rem; font-style: italic;">No candidates assigned yet</span>';
    }

    html += `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(post.id)}</td>
        <td style="font-weight: 700; color: var(--slate-900); font-size: 1rem;">${Utils.escapeHtml(post.name)}</td>
        <td>
          <span style="font-weight: 500; color: var(--slate-700);">${Utils.escapeHtml(elec ? (elec.title || elec.name) : post.electionId)}</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: var(--slate-600);">${post.order || 1}</td>
        <td>
          <div style="max-width: 260px;">
            ${candidateBadges}
          </div>
        </td>
        <td style="font-size: 0.85rem; color: var(--slate-600); max-width: 250px;">
          ${Utils.escapeHtml(post.description || '—')}
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="editPost('${post.id}')" title="Edit Post">
              Edit
            </button>
            <a href="candidates.html?postId=${encodeURIComponent(post.id)}" class="btn btn-sm btn-secondary" title="Manage Candidates for this post">
              Assign (${postCandidates.length})
            </a>
            <button type="button" class="btn btn-sm btn-danger" onclick="openDeletePostModal('${post.id}')" title="Delete Post">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function handlePostFormSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById('post-form-mode').value;
  const originalId = document.getElementById('post-original-id').value;

  const postId = document.getElementById('post-id-input').value.trim();
  const name = document.getElementById('post-name-input').value.trim();
  const electionId = document.getElementById('post-election-select').value;
  const order = parseInt(document.getElementById('post-order-input').value, 10) || 1;
  const description = document.getElementById('post-desc-input').value.trim();

  if (!postId) {
    Utils.showToast('Please enter a Post ID.', 'error');
    document.getElementById('post-id-input').focus();
    return;
  }

  if (!name) {
    Utils.showToast('Please enter a Position Title.', 'error');
    document.getElementById('post-name-input').focus();
    return;
  }

  if (!electionId) {
    Utils.showToast('Please select an election.', 'error');
    return;
  }

  const posts = Storage.getData('posts', []);
  const existing = posts.find(p => p.id.toLowerCase() === postId.toLowerCase());

  if (mode === 'add' && existing) {
    Utils.showToast('Post ID already exists. Please choose a unique ID.', 'error');
    document.getElementById('post-id-input').focus();
    return;
  }

  if (mode === 'edit' && existing && existing.id !== originalId) {
    Utils.showToast('Post ID already exists on another position.', 'error');
    document.getElementById('post-id-input').focus();
    return;
  }

  if (mode === 'add') {
    const newPost = {
      id: postId,
      name,
      electionId,
      order,
      description
    };
    Storage.appendData('posts', newPost);
    Storage.addLog('Post Created', `Admin created post "${name}" (${postId}).`, 'admin');
    Utils.showToast(`Post "${name}" created successfully!`, 'success');
  } else {
    const existingPost = posts.find(p => p.id === originalId);
    const updatedPost = {
      ...existingPost,
      id: postId,
      name,
      electionId,
      order,
      description
    };
    Storage.updateData('posts', originalId, updatedPost);
    Storage.addLog('Post Updated', `Admin updated post "${name}" (${postId}).`, 'admin');
    Utils.showToast(`Post "${name}" updated successfully!`, 'success');
  }

  Utils.closeModal('post-modal');
  loadPostsTable();
}

window.editPost = function(postId) {
  const posts = Storage.getData('posts', []);
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  resetPostForm();
  document.getElementById('modal-post-title').textContent = 'Edit Electoral Post';
  document.getElementById('post-form-mode').value = 'edit';
  document.getElementById('post-original-id').value = post.id;

  const idInput = document.getElementById('post-id-input');
  idInput.value = post.id;
  idInput.setAttribute('readonly', 'true');

  document.getElementById('post-name-input').value = post.name || '';
  document.getElementById('post-order-input').value = post.order || 1;
  document.getElementById('post-desc-input').value = post.description || '';

  const electionSelect = document.getElementById('post-election-select');
  if (electionSelect && post.electionId) {
    electionSelect.value = post.electionId;
  }

  Utils.openModal('post-modal');
};

window.openDeletePostModal = function(postId) {
  const posts = Storage.getData('posts', []);
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  postToDeleteId = postId;
  document.getElementById('delete-post-name-display').textContent = post.name;
  document.getElementById('delete-post-id-display').textContent = post.id;

  Utils.openModal('delete-post-modal');
};

function handleConfirmDeletePost() {
  if (!postToDeleteId) return;

  const posts = Storage.getData('posts', []);
  const post = posts.find(p => p.id === postToDeleteId);
  const pName = post ? post.name : postToDeleteId;

  Storage.deleteData('posts', postToDeleteId);
  Storage.addLog('Post Deleted', `Admin deleted post "${pName}" (${postToDeleteId}).`, 'admin');
  Utils.showToast(`Post "${pName}" deleted.`, 'info');

  postToDeleteId = null;
  Utils.closeModal('delete-post-modal');
  loadPostsTable();
}

function resetPostForm() {
  const form = document.getElementById('post-form');
  if (form) form.reset();
}
