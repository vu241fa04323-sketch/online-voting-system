/**
 * VoteSecure - Voting Experience & Duplicate Prevention Controller
 * Handles post-wise candidate selection, review modal, duplicate prevention, and ballot confirmation.
 */

let activeElection = null;
let electionPosts = [];
let candidatesMapByPost = {};
let selectedCandidates = {}; // { postId: candidateId }

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('voter')) return;

  initVotingProcess();
});

function initVotingProcess() {
  const user = Auth.getCurrentUser();
  if (!user) return;

  // Personalize topbar
  document.querySelectorAll('.user-display-name').forEach(el => {
    el.textContent = user.fullName || user.name;
  });
  document.querySelectorAll('.user-display-id').forEach(el => {
    el.textContent = user.userId || user.id;
  });

  // Retrieve electionId from query params or currentElection in storage
  const urlParams = new URLSearchParams(window.location.search);
  const requestedElectionId = urlParams.get('electionId') || Storage.getData('currentElection', 'ELECTION001');

  const elections = Storage.getData('elections', []);
  activeElection = elections.find(e => e.id === requestedElectionId) || elections.find(e => e.status === 'Active');

  // Check 1: Does election exist and is it active?
  if (!activeElection || activeElection.status !== 'Active') {
    renderInactiveElectionState(activeElection);
    return;
  }

  // Check 2: Has this voter already voted in this election? (Section 20)
  if (Storage.hasVoted(user.id, activeElection.id)) {
    renderAlreadyVotedState(user.id, activeElection.id);
    return;
  }

  // Set election meta in UI
  const electionTitleEl = document.getElementById('voting-election-title');
  if (electionTitleEl) electionTitleEl.textContent = activeElection.title || activeElection.name;

  const electionDescEl = document.getElementById('voting-election-desc');
  if (electionDescEl) electionDescEl.textContent = activeElection.description;

  // Load posts & candidates
  loadPostsAndCandidates();

  // Attach Review & Submit buttons
  const reviewBtn = document.getElementById('btn-review-vote');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', handleOpenReviewModal);
  }

  const confirmSubmitBtn = document.getElementById('btn-confirm-submit-vote');
  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener('click', handleSubmitBallot);
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
 * Render locked state when election is not active
 */
function renderInactiveElectionState(election) {
  const container = document.getElementById('voting-container-main');
  if (!container) return;

  container.innerHTML = `
    <div class="card text-center" style="max-width: 600px; margin: 3rem auto; padding: 3rem 2rem;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background-color: var(--warning-subtle); color: #92400e; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
        <svg width="36" height="36" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      </div>
      <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Voting is Not Active</h2>
      <p class="text-secondary" style="margin-bottom: 2rem;">
        ${election ? `The election "${Utils.escapeHtml(election.title || election.name)}" currently has status: <strong>${election.status}</strong>.` : 'No active election is available.'}
      </p>
      <a href="voter-dashboard.html" class="btn btn-primary" style="margin: 0 auto;">Return to Dashboard</a>
    </div>
  `;
}

/**
 * Render duplicate vote prevention block (Section 20: "You have already voted in this election.")
 */
function renderAlreadyVotedState(voterId, electionId) {
  const container = document.getElementById('voting-container-main');
  if (!container) return;

  const votes = Storage.getData('votes', []);
  const existingVote = votes.find(v => (v.voterId === voterId || v.userId === voterId) && v.electionId === electionId);

  container.innerHTML = `
    <div class="card text-center" style="max-width: 620px; margin: 3rem auto; padding: 3rem 2rem;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background-color: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
        <svg width="36" height="36" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      </div>
      <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--slate-900);">You have already voted in this election.</h2>
      <p class="text-secondary" style="margin-bottom: 1.5rem; line-height: 1.6;">
        Our election ledger confirms your official ballot has already been submitted and sealed for <strong>${Utils.escapeHtml(activeElection.title || activeElection.name)}</strong>. 
        Each registered voter may only cast a single verified vote.
      </p>

      ${existingVote ? `
        <div style="background-color: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; display: inline-block;">
          <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700; margin-bottom: 0.35rem;">Confirmation Number</div>
          <div style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; color: var(--primary);">${existingVote.id || existingVote.confirmationNumber}</div>
          <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.35rem;">Recorded on: ${Utils.formatDateTime(existingVote.timestamp || existingVote.votedAt)}</div>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: center; gap: 1rem;">
        <a href="voter-dashboard.html" class="btn btn-secondary">Return to Dashboard</a>
        <a href="profile.html#history" class="btn btn-primary">View My Voting Status</a>
      </div>
    </div>
  `;
}

/**
 * Load posts and candidate cards into the voting page
 */
function loadPostsAndCandidates() {
  const posts = Storage.getData('posts', []).filter(p => p.electionId === activeElection.id);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === activeElection.id);

  posts.sort((a, b) => (a.order || 0) - (b.order || 0));
  electionPosts = posts;

  // Group candidates by post
  candidatesMapByPost = {};
  posts.forEach(p => {
    candidatesMapByPost[p.id] = candidates.filter(c => c.postId === p.id && c.status === 'Active');
  });

  renderBallotSections();
  updateSelectionCounter();
}

/**
 * Render post sections with single-select candidate cards (Sections 16 & 17)
 */
function renderBallotSections() {
  const container = document.getElementById('posts-voting-container');
  if (!container) return;

  if (electionPosts.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">No electoral posts configured for this election.</p>';
    return;
  }

  let html = '';
  electionPosts.forEach((post, index) => {
    const postCandidates = candidatesMapByPost[post.id] || [];

    html += `
      <section class="post-section" data-post-id="${post.id}" style="margin-bottom: 2.5rem;">
        <div class="post-header">
          <div class="post-title-wrapper">
            <div class="post-number-badge">${index + 1}</div>
            <div>
              <h2 class="post-name">POST: ${Utils.escapeHtml(post.name.toUpperCase())}</h2>
              <div style="font-size: 0.85rem; color: var(--slate-500);">${Utils.escapeHtml(post.description || 'Select exactly ONE candidate')}</div>
            </div>
          </div>
          <span class="post-requirement-tag">Select 1 Candidate</span>
        </div>

        <div class="candidates-voting-grid">
    `;

    if (postCandidates.length === 0) {
      html += `<div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--slate-500);">No active candidates nominated for this post.</div>`;
    } else {
      postCandidates.forEach(cand => {
        const photoSrc = cand.photo?.startsWith('data:') ? cand.photo : `../${cand.photo || 'assets/images/default-avatar.svg'}`;
        const symbolSrc = cand.symbolPath?.startsWith('data:') ? cand.symbolPath : `../${cand.symbolPath || 'assets/symbols/torch.svg'}`;

        html += `
          <div class="candidate-vote-card" 
               id="cand-card-${cand.id}" 
               onclick="selectCandidateForPost('${post.id}', '${cand.id}')"
               role="radio"
               aria-checked="false"
               tabindex="0">
            <img src="${photoSrc}" class="candidate-vote-avatar" alt="${Utils.escapeHtml(cand.name)}" onerror="this.src='../assets/images/default-avatar.svg'">
            
            <h3 class="candidate-vote-name">${Utils.escapeHtml(cand.name)}</h3>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--slate-500); margin-bottom: 0.5rem;">
              ID: ${Utils.escapeHtml(cand.id)}
            </div>

            <!-- Candidate Symbol -->
            <div class="candidate-vote-symbol">
              <img src="${symbolSrc}" alt="${Utils.escapeHtml(cand.symbolName || 'Symbol')}">
              <span>${Utils.escapeHtml(cand.symbolName || 'Official Symbol')}</span>
            </div>

            <!-- Description -->
            <p class="candidate-vote-manifesto">${Utils.escapeHtml(cand.description || 'Dedicated to student representation and campus progress.')}</p>

            <!-- Radio select button indicator -->
            <div class="vote-radio-indicator">
              <div class="vote-radio-circle"></div>
              <span class="vote-radio-text">Select</span>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </section>
    `;
  });

  container.innerHTML = html;
}

/**
 * Handle single candidate selection for each post (Section 16: exactly ONE candidate per post)
 */
window.selectCandidateForPost = function(postId, candidateId) {
  selectedCandidates[postId] = candidateId;

  // Uncheck all other candidates for this post
  const postSection = document.querySelector(`.post-section[data-post-id="${postId}"]`);
  if (!postSection) return;

  postSection.querySelectorAll('.candidate-vote-card').forEach(card => {
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');
    const radioText = card.querySelector('.vote-radio-text');
    if (radioText) radioText.textContent = 'Select';
  });

  // Check this selected card
  const selectedCard = document.getElementById(`cand-card-${candidateId}`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    selectedCard.setAttribute('aria-checked', 'true');
    const radioText = selectedCard.querySelector('.vote-radio-text');
    if (radioText) radioText.textContent = 'Selected ✓';
  }

  updateSelectionCounter();
};

function updateSelectionCounter() {
  const counterEl = document.getElementById('voting-progress-counter');
  const totalPosts = electionPosts.length;
  const selectedCount = Object.keys(selectedCandidates).length;

  if (counterEl) {
    counterEl.textContent = `${selectedCount} of ${totalPosts} positions selected`;
  }
}

/**
 * Open Review Vote Modal (Section 18)
 */
function handleOpenReviewModal() {
  const totalPosts = electionPosts.length;
  const selectedCount = Object.keys(selectedCandidates).length;

  if (selectedCount < totalPosts) {
    Utils.showToast(`Please select a candidate for all ${totalPosts} positions before reviewing.`, 'warning');
    return;
  }

  const listContainer = document.getElementById('review-selections-list');
  if (!listContainer) return;

  const candidates = Storage.getData('candidates', []);

  let html = '';
  electionPosts.forEach(post => {
    const candId = selectedCandidates[post.id];
    const cand = candidates.find(c => c.id === candId);
    const symbolSrc = cand?.symbolPath?.startsWith('data:') ? cand.symbolPath : `../${cand?.symbolPath || 'assets/symbols/torch.svg'}`;

    html += `
      <div class="review-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500);">${Utils.escapeHtml(post.name)}</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--slate-900);">${Utils.escapeHtml(cand?.name || 'Unselected')}</div>
          <div style="font-size: 0.75rem; color: var(--slate-500); font-family: var(--font-mono);">Candidate ID: ${Utils.escapeHtml(cand?.id || '')}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--white); padding: 0.4rem 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--slate-200);">
          <img src="${symbolSrc}" style="width: 24px; height: 24px; object-fit: contain;" alt="${Utils.escapeHtml(cand?.symbolName || 'Symbol')}">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(cand?.symbolName || 'Official Symbol')}</span>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
  Utils.openModal('review-vote-modal');
}

/**
 * Final submit ballot action with all 5 verification checks (Section 19)
 */
function handleSubmitBallot() {
  const user = Auth.getCurrentUser();

  // Check 1: User is authenticated
  if (!user) {
    Utils.showToast('Authentication error. Please log in again.', 'error');
    window.location.href = 'voter-login.html';
    return;
  }

  // Check 2: User is an active voter
  const voters = Storage.getData('voters', []);
  const voterRecord = voters.find(v => (v.id === user.id || v.userId === user.id));
  if (!voterRecord || voterRecord.status !== 'Active') {
    Utils.closeModal('review-vote-modal');
    Utils.showToast('Your account is Inactive or suspended. You cannot cast a ballot.', 'error');
    return;
  }

  // Check 3: Election is active
  if (!activeElection || activeElection.status !== 'Active') {
    Utils.closeModal('review-vote-modal');
    Utils.showToast('Voting is closed. This election is not currently active.', 'error');
    renderInactiveElectionState(activeElection);
    return;
  }

  // Check 4: Required candidate selections have been made
  const totalPosts = electionPosts.length;
  const selectedCount = Object.keys(selectedCandidates).length;
  if (selectedCount < totalPosts) {
    Utils.closeModal('review-vote-modal');
    Utils.showToast(`Please complete selections for all ${totalPosts} positions.`, 'error');
    return;
  }

  // Check 5: User has not already voted in this election
  if (Storage.hasVoted(user.id, activeElection.id)) {
    Utils.closeModal('review-vote-modal');
    Utils.showToast('You have already voted in this election.', 'error');
    renderAlreadyVotedState(user.id, activeElection.id);
    return;
  }

  // If all checks pass: Record vote atomically
  const result = Storage.recordVote({
    electionId: activeElection.id,
    voterId: user.id,
    selections: selectedCandidates
  });

  if (!result.success) {
    Utils.showToast(result.message, 'error');
    return;
  }

  Utils.closeModal('review-vote-modal');
  Utils.showToast('Vote Submitted Successfully!', 'success', 5000);

  // Render Official Success Screen / Confirmation (Section 21)
  renderSuccessReceipt(result, user);
}

/**
 * Display the Vote Submitted Successfully confirmation screen (Section 21 format)
 */
function renderSuccessReceipt(result, user) {
  const container = document.getElementById('voting-container-main');
  if (!container) return;

  const candidates = Storage.getData('candidates', []);

  // Format Date and Time
  const voteDate = new Date(result.timestamp);
  const formattedDate = voteDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = voteDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let selectionsRows = '';
  electionPosts.forEach(post => {
    const candId = selectedCandidates[post.id];
    const cand = candidates.find(c => c.id === candId);
    const symbolSrc = cand?.symbolPath?.startsWith('data:') ? cand.symbolPath : `../${cand?.symbolPath || 'assets/symbols/torch.svg'}`;

    selectionsRows += `
      <tr>
        <td style="color: var(--slate-600); font-weight: 600;">${Utils.escapeHtml(post.name)}:</td>
        <td>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
            <strong style="color: var(--slate-900);">${Utils.escapeHtml(cand ? cand.name : 'N/A')}</strong>
            <img src="${symbolSrc}" style="width: 20px; height: 20px; object-fit: contain;" alt="">
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="receipt-card" style="max-width: 650px; margin: 2rem auto; background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--slate-200);">
      <div class="receipt-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: var(--white); padding: 2.5rem 2rem; text-align: center;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(255, 255, 255, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
          <svg width="36" height="36" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        </div>
        <h1 style="font-size: 1.85rem; font-weight: 800; margin: 0 0 0.5rem; color: var(--white);">Vote Submitted Successfully</h1>
        <p style="font-size: 1rem; opacity: 0.95; margin: 0;">Your vote has been successfully recorded.</p>
        
        <div style="margin-top: 1.5rem; background: rgba(0, 0, 0, 0.2); border-radius: var(--radius-sm); padding: 0.75rem 1.5rem; display: inline-block;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Confirmation Number</div>
          <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; letter-spacing: 0.05em; margin-top: 0.25rem;">
            ${Utils.escapeHtml(result.confirmationId || result.confirmationNumber)}
          </div>
        </div>
      </div>

      <div class="receipt-body" style="padding: 2rem;">
        <table class="receipt-details-table" style="width: 100%; margin-bottom: 1.5rem;">
          <tr>
            <td style="color: var(--slate-600); font-weight: 600; padding: 0.5rem 0;">Election:</td>
            <td style="text-align: right; font-weight: 700; color: var(--slate-900); padding: 0.5rem 0;">
              ${Utils.escapeHtml(activeElection.title || activeElection.name)}
            </td>
          </tr>
          <tr>
            <td style="color: var(--slate-600); font-weight: 600; padding: 0.5rem 0;">Voter:</td>
            <td style="text-align: right; font-weight: 700; color: var(--slate-900); padding: 0.5rem 0;">
              ${Utils.escapeHtml(user.fullName || user.name)}
            </td>
          </tr>
          <tr>
            <td style="color: var(--slate-600); font-weight: 600; padding: 0.5rem 0;">Date:</td>
            <td style="text-align: right; font-weight: 600; color: var(--slate-800); padding: 0.5rem 0;">
              ${formattedDate}
            </td>
          </tr>
          <tr>
            <td style="color: var(--slate-600); font-weight: 600; padding: 0.5rem 0;">Time:</td>
            <td style="text-align: right; font-weight: 600; color: var(--slate-800); padding: 0.5rem 0;">
              ${formattedTime}
            </td>
          </tr>
          ${selectionsRows}
        </table>

        <div style="background-color: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.82rem; color: var(--slate-600); text-align: center; margin-bottom: 1.75rem; line-height: 1.5;">
          You can keep or print this receipt for your records. One vote per election is now permanently enforced for your account.
        </div>

        <div style="display: flex; gap: 1rem;">
          <button class="btn btn-secondary" style="flex: 1;" onclick="window.print()">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg>
            Print Receipt
          </button>
          <a href="voter-dashboard.html" class="btn btn-primary btn-lg" style="flex: 1; text-align: center;">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
}
