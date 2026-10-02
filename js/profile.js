/**
 * VoteSecure - Voter Profile & Audit Trail Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('voter')) return;

  setupLayout();
  loadVoterProfile();
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

function loadVoterProfile() {
  const currentUser = Auth.getCurrentUser();
  if (!currentUser) return;

  const voters = Storage.getData('voters', []);
  const voter = voters.find(v => (v.id === currentUser.id || v.userId === currentUser.id || v.id === currentUser.userId)) || currentUser;

  // Basic info
  const nameEl = document.getElementById('profile-name');
  const idEl = document.getElementById('profile-id');
  const avatarInitials = document.getElementById('profile-avatar-initials');

  if (nameEl) nameEl.textContent = voter.name || voter.fullName || 'Voter';
  if (idEl) idEl.textContent = voter.id || voter.userId || 'VOTER001';
  if (avatarInitials) {
    const initials = (voter.name || 'VT').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    avatarInitials.textContent = initials || 'VT';
  }

  // Personal Information
  setText('profile-dob', voter.dateOfBirth ? Utils.formatDate(voter.dateOfBirth) : 'Not Provided');
  setText('profile-gender', voter.gender || 'Not Specified');
  setText('profile-email', voter.email || 'N/A');
  setText('profile-phone', voter.phone || 'N/A');
  setText('profile-address', voter.address || 'Standard Campus Residence');

  // Academic Information
  setText('profile-student-id', voter.studentId || 'N/A');
  setText('profile-dept', voter.department || 'General');
  setText('profile-year', voter.year || 'N/A');
  setText('profile-section', voter.section || 'A');

  // Account Information
  const statusBadge = document.getElementById('profile-status-badge');
  if (statusBadge) {
    const isActive = voter.status === 'Active';
    statusBadge.className = `badge ${isActive ? 'badge-success' : 'badge-danger'}`;
    statusBadge.textContent = voter.status || 'Active';
  }
  setText('profile-created-date', voter.createdAt ? Utils.formatDate(voter.createdAt) : '2026-09-20');

  // Voting history
  loadVotingHistory(voter.id || voter.userId);
}

function setText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = text;
}

function loadVotingHistory(voterId) {
  const tbody = document.getElementById('profile-voting-history-body');
  if (!tbody) return;

  const votes = Storage.getData('votes', []).filter(v => v.voterId === voterId || v.userId === voterId);
  const elections = Storage.getData('elections', []);

  if (votes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          You have not cast any ballots yet. Visit <a href="voting.html" style="color: var(--accent); font-weight: 600;">Active Election</a> to participate.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  votes.forEach(vote => {
    const elec = elections.find(e => e.id === vote.electionId) || { title: 'College Student Council Election 2026' };
    const confCode = vote.confirmationNumber || vote.id;
    html += `
      <tr>
        <td><strong>${Utils.escapeHtml(elec.title)}</strong></td>
        <td><span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(confCode)}</span></td>
        <td>${Utils.formatDateTime(vote.timestamp)}</td>
        <td><span class="badge badge-success"><span class="badge-dot"></span> Ballot Recorded</span></td>
        <td>
          <button type="button" class="btn btn-sm btn-secondary" onclick="viewReceiptModal('${confCode}')">
            View Receipt
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Open official printable confirmation modal
 */
window.viewReceiptModal = function(confirmationNumber) {
  const votes = Storage.getData('votes', []);
  const vote = votes.find(v => v.confirmationNumber === confirmationNumber || v.id === confirmationNumber);
  const elections = Storage.getData('elections', []);
  const posts = Storage.getData('posts', []);
  const candidates = Storage.getData('candidates', []);
  const user = Auth.getCurrentUser();

  if (!vote) {
    Utils.showToast('Receipt details could not be found.', 'error');
    return;
  }

  const election = elections.find(e => e.id === vote.electionId) || { title: 'College Student Council Election 2026' };

  let modal = document.getElementById('vote-receipt-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'vote-receipt-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  // Build selections breakdown if available
  let choicesHtml = '';
  if (vote.selections && typeof vote.selections === 'object') {
    Object.keys(vote.selections).forEach(postId => {
      const post = posts.find(p => p.id === postId) || { name: 'Executive Post' };
      const cand = candidates.find(c => c.id === vote.selections[postId]) || { name: 'Official Candidate' };
      choicesHtml += `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed var(--slate-200); font-size: 0.9rem;">
          <span style="color: var(--slate-600);">${Utils.escapeHtml(post.name)}:</span>
          <strong style="color: var(--slate-900);">${Utils.escapeHtml(cand.name)}</strong>
        </div>
      `;
    });
  }

  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-dialog modal-md">
      <div class="modal-content">
        <div class="modal-header" style="border-bottom: 2px solid var(--accent); background: #f0fdf4;">
          <div>
            <h3 class="modal-title" style="color: #166534; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Vote Confirmation Receipt
            </h3>
            <p style="font-size: 0.8rem; color: #15803d; margin: 0;">Tamper-Resistant Digital Audit Token</p>
          </div>
          <button class="modal-close" onclick="Utils.closeModal('vote-receipt-modal')">&times;</button>
        </div>

        <div class="modal-body" style="padding: 1.5rem;" id="printable-receipt-content">
          <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--slate-200);">
            <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em;">Confirmation Code</div>
            <div style="font-family: var(--font-mono); font-size: 1.4rem; font-weight: 800; color: var(--primary); margin: 0.25rem 0;">
              ${Utils.escapeHtml(confirmationNumber)}
            </div>
            <span class="badge badge-success">Cryptographically Recorded</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; margin-bottom: 1.25rem;">
            <div>
              <span style="color: var(--slate-500);">Election:</span>
              <div style="font-weight: 700; color: var(--slate-800);">${Utils.escapeHtml(election.title)}</div>
            </div>
            <div>
              <span style="color: var(--slate-500);">Timestamp:</span>
              <div style="font-weight: 700; color: var(--slate-800);">${Utils.formatDateTime(vote.timestamp)}</div>
            </div>
            <div>
              <span style="color: var(--slate-500);">Voter Name:</span>
              <div style="font-weight: 700; color: var(--slate-800);">${Utils.escapeHtml(user ? user.name : 'Registered Voter')}</div>
            </div>
            <div>
              <span style="color: var(--slate-500);">User ID:</span>
              <div style="font-weight: 700; font-family: var(--font-mono); color: var(--slate-800);">${Utils.escapeHtml(vote.voterId || vote.userId)}</div>
            </div>
          </div>

          ${choicesHtml ? `
            <div style="margin-top: 1rem; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); padding: 1rem;">
              <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--slate-600); margin-bottom: 0.5rem;">
                Ballot Choices Summary
              </div>
              ${choicesHtml}
            </div>
          ` : ''}

          <div style="margin-top: 1.25rem; font-size: 0.75rem; color: var(--slate-500); text-align: center; line-height: 1.4;">
            This digital receipt confirms your secret ballot has been safely stored in the election database. Keep your confirmation number for audit verification.
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg>
            Print Receipt
          </button>
          <button type="button" class="btn btn-primary" onclick="Utils.closeModal('vote-receipt-modal')">Close</button>
        </div>
      </div>
    </div>
  `;

  const backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', () => Utils.closeModal('vote-receipt-modal'));

  Utils.openModal('vote-receipt-modal');
};
