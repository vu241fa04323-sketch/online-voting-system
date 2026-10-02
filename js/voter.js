/**
 * VoteSecure - Voter Dashboard Controller
 * Displays voter profile greeting, user ID, department, active election, voting status, and direct voting access.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('voter')) return;

  setupVoterLayout();
  loadVoterDashboard();
});

function setupVoterLayout() {
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

function loadVoterDashboard() {
  const user = Auth.getCurrentUser();
  if (!user) return;

  // Header display name & ID
  document.querySelectorAll('.user-display-name').forEach(el => {
    el.textContent = user.fullName || user.name;
  });
  document.querySelectorAll('.user-display-id').forEach(el => {
    el.textContent = user.userId || user.id;
  });

  // Section 15 display fields
  const welcomeHeading = document.getElementById('voter-welcome-heading');
  if (welcomeHeading) {
    welcomeHeading.textContent = `Welcome, ${user.fullName || user.name}`;
  }

  const userIdEl = document.getElementById('voter-display-userid');
  if (userIdEl) {
    userIdEl.textContent = user.userId || user.id;
  }

  const deptEl = document.getElementById('voter-info-department');
  if (deptEl) {
    deptEl.textContent = user.department || 'Computer Science';
  }

  const elections = Storage.getData('elections', []);
  const votes = Storage.getData('votes', []);

  // Filter votes cast by this voter
  const voterVotes = votes.filter(v => v.voterId === user.id || v.userId === user.id);
  const activeElections = elections.filter(e => e.status === 'Active');

  // Primary active election
  const currentElection = activeElections[0] || elections[0] || null;

  const currentElecNameEl = document.getElementById('voter-current-election-name');
  if (currentElecNameEl) {
    currentElecNameEl.textContent = currentElection ? (currentElection.title || currentElection.name) : 'No Active Election';
  }

  // Voting Status (Section 15)
  const statusIndicator = document.getElementById('voter-status-indicator');
  const heroActionContainer = document.getElementById('voter-hero-action-container');

  const hasVotedCurrent = currentElection ? Storage.hasVoted(user.id, currentElection.id) : false;

  if (statusIndicator) {
    if (!currentElection || currentElection.status !== 'Active') {
      statusIndicator.innerHTML = '<span style="color: #cbd5e1;">⚪ Voting Closed</span>';
    } else if (hasVotedCurrent) {
      statusIndicator.innerHTML = '<span style="color: #86efac; font-weight: 700;">✓ Ballot Submitted (Vote Recorded)</span>';
    } else {
      statusIndicator.innerHTML = '<span style="color: #86efac; font-weight: 700;">🟢 Voting Open</span>';
    }
  }

  if (heroActionContainer) {
    if (currentElection && currentElection.status === 'Active') {
      if (hasVotedCurrent) {
        heroActionContainer.innerHTML = `
          <a href="profile.html#history" class="btn btn-secondary btn-lg" style="box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            View Voting Receipt
          </a>
        `;
      } else {
        heroActionContainer.innerHTML = `
          <a href="voting.html?electionId=${encodeURIComponent(currentElection.id)}" class="btn btn-accent btn-lg" id="btn-hero-vote-now" style="font-size: 1.15rem; padding: 0.9rem 1.75rem; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Vote Now
          </a>
        `;
      }
    } else {
      heroActionContainer.innerHTML = `
        <span class="badge badge-neutral" style="padding: 0.6rem 1rem; font-size: 0.95rem;">
          No Active Elections Currently Open
        </span>
      `;
    }
  }

  // Metric counters
  const activeCountEl = document.getElementById('metric-active-elections-count');
  if (activeCountEl) activeCountEl.textContent = activeElections.length;

  const participatedCountEl = document.getElementById('metric-participated-count');
  if (participatedCountEl) participatedCountEl.textContent = voterVotes.length;

  // Render Available Elections List
  renderAvailableElections(elections, voterVotes);
}

function renderAvailableElections(elections, voterVotes) {
  const container = document.getElementById('available-elections-container');
  if (!container) return;

  if (elections.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">No elections are scheduled at this time.</p>';
    return;
  }

  const user = Auth.getCurrentUser();
  let html = '';

  elections.forEach(elec => {
    const hasVoted = user ? Storage.hasVoted(user.id, elec.id) : false;
    const userVote = voterVotes.find(v => v.electionId === elec.id);

    let buttonHtml = '';
    if (elec.status === 'Active') {
      if (hasVoted) {
        buttonHtml = `
          <a href="profile.html#history" class="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
            View Voting Receipt
          </a>
        `;
      } else {
        buttonHtml = `
          <a href="voting.html?electionId=${encodeURIComponent(elec.id)}" class="btn btn-accent btn-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Vote Now
          </a>
        `;
      }
    } else if (elec.status === 'Upcoming') {
      buttonHtml = `
        <button class="btn btn-secondary" disabled>
          Voting Opens ${Utils.formatDate(elec.startDate)}
        </button>
      `;
    } else {
      // Completed
      buttonHtml = `
        <span class="badge badge-neutral" style="padding: 0.5rem 1rem;">Election Concluded</span>
      `;
    }

    html += `
      <div class="card" style="margin-bottom: 1.5rem; border: 1px solid var(--slate-200);">
        <div class="card-body" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
          <div style="flex: 1; min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <span class="badge ${elec.status === 'Active' ? 'badge-success' : elec.status === 'Upcoming' ? 'badge-primary' : 'badge-neutral'}">
                ${elec.status === 'Active' ? '<span class="badge-dot"></span>' : ''} ${elec.status}
              </span>
              <span style="font-size: 0.85rem; color: var(--slate-500);">
                Duration: ${Utils.formatDate(elec.startDate)} &ndash; ${Utils.formatDate(elec.endDate)}
              </span>
            </div>
            <h3 style="font-size: 1.35rem; color: var(--slate-900); margin-bottom: 0.5rem; font-weight: 700;">
              ${Utils.escapeHtml(elec.title || elec.name)}
            </h3>
            <p style="font-size: 0.95rem; color: var(--slate-600); margin: 0; line-height: 1.5;">
              ${Utils.escapeHtml(elec.description || 'No description provided.')}
            </p>
          </div>
          <div>
            ${buttonHtml}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
