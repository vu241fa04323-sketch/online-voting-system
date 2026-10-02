/**
 * VoteSecure - Admin Dashboard Controller
 * Calculates all metrics, election status breakdown, candidate preview, and recent activity logs.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupAdminLayout();
  loadDashboardMetrics();
});

function setupAdminLayout() {
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

function loadDashboardMetrics() {
  const voters = Storage.getData('voters', []);
  const candidates = Storage.getData('candidates', []);
  const elections = Storage.getData('elections', []);
  const votes = Storage.getData('votes', []);
  const logs = Storage.getData('logs', []);

  // Find active election
  const activeElection = elections.find(e => e.status === 'Active') || elections[0] || null;

  // Counts (Section 25)
  const totalVoters = voters.length;
  const activeVoters = voters.filter(v => v.status === 'Active').length;
  const totalCandidates = candidates.length;
  const totalElections = elections.length;
  const totalVotesCast = votes.length;

  // Participation percentage for current active election
  const activeElecVotes = activeElection ? votes.filter(v => v.electionId === activeElection.id) : [];
  const participationRate = activeVoters > 0 
    ? Math.round((activeElecVotes.length / activeVoters) * 100) 
    : 0;

  // Populate Metric Cards
  const totalVotersEl = document.getElementById('metric-total-voters');
  if (totalVotersEl) totalVotersEl.textContent = totalVoters;

  const activeVotersEl = document.getElementById('metric-active-voters');
  if (activeVotersEl) activeVotersEl.textContent = activeVoters;

  const totalCandidatesEl = document.getElementById('metric-total-candidates');
  if (totalCandidatesEl) totalCandidatesEl.textContent = totalCandidates;

  const totalElectionsEl = document.getElementById('metric-total-elections');
  if (totalElectionsEl) totalElectionsEl.textContent = totalElections;

  const totalVotesEl = document.getElementById('metric-total-votes');
  if (totalVotesEl) totalVotesEl.textContent = totalVotesCast;

  const participationRateEl = document.getElementById('metric-participation-rate');
  if (participationRateEl) participationRateEl.textContent = `${participationRate}%`;

  // Topbar Pill
  const topbarElectionStatusEl = document.getElementById('topbar-election-status');
  if (topbarElectionStatusEl && activeElection) {
    topbarElectionStatusEl.innerHTML = `
      <span class="badge ${activeElection.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
        <span class="badge-dot"></span> ${activeElection.status}
      </span>
      <span style="font-weight: 600; font-size: 0.85rem; color: var(--slate-700);">${Utils.escapeHtml(activeElection.title || activeElection.name)}</span>
    `;
  }

  // Turnout Progress Bar
  const turnoutProgressBar = document.getElementById('turnout-progress-bar');
  if (turnoutProgressBar) {
    turnoutProgressBar.style.width = `${participationRate}%`;
  }

  const turnoutRatioEl = document.getElementById('turnout-ratio-text');
  if (turnoutRatioEl) {
    turnoutRatioEl.textContent = `${activeElecVotes.length} of ${activeVoters} active voters (${participationRate}%)`;
  }

  // Render Election Status Breakdown (Upcoming, Active, Completed)
  renderElectionStatusBreakdown(elections);

  // Render Candidate Vote Statistics Widget
  renderCandidateVotePreview(activeElection, activeElecVotes);

  // Render Recent Activity Feed
  renderRecentActivity(logs);
}

/**
 * Render Election Status Cards (Section 25: Upcoming, Active, Completed)
 */
function renderElectionStatusBreakdown(elections) {
  const container = document.getElementById('election-status-cards-container');
  if (!container) return;

  const upcomingCount = elections.filter(e => e.status === 'Upcoming').length;
  const activeCount = elections.filter(e => e.status === 'Active').length;
  const completedCount = elections.filter(e => e.status === 'Completed').length;

  container.innerHTML = `
    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-left: 4px solid var(--accent); border-radius: var(--radius-sm); padding: 1rem;">
      <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">🟢 Active Elections</div>
      <div style="font-size: 1.75rem; font-weight: 800; color: var(--accent); margin: 0.25rem 0;">${activeCount}</div>
      <div style="font-size: 0.78rem; color: var(--slate-600);">Ballots open for active voters</div>
    </div>

    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-left: 4px solid var(--primary); border-radius: var(--radius-sm); padding: 1rem;">
      <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">🔵 Upcoming Elections</div>
      <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); margin: 0.25rem 0;">${upcomingCount}</div>
      <div style="font-size: 0.78rem; color: var(--slate-600);">Scheduled campaign events</div>
    </div>

    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-left: 4px solid var(--slate-500); border-radius: var(--radius-sm); padding: 1rem;">
      <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">⚪ Completed Elections</div>
      <div style="font-size: 1.75rem; font-weight: 800; color: var(--slate-700); margin: 0.25rem 0;">${completedCount}</div>
      <div style="font-size: 0.78rem; color: var(--slate-600);">Final tallies available</div>
    </div>
  `;
}

/**
 * Render preview of leading candidates in active election
 */
function renderCandidateVotePreview(activeElection, electionVotes) {
  const container = document.getElementById('candidate-stats-preview');
  if (!container) return;

  if (!activeElection) {
    container.innerHTML = '<p class="text-muted text-center py-4">No election found.</p>';
    return;
  }

  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === activeElection.id);
  const posts = Storage.getData('posts', []).filter(p => p.electionId === activeElection.id);

  if (posts.length === 0 || candidates.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">No candidates configured for this election.</p>';
    return;
  }

  // Primary post (e.g., President)
  const primaryPost = posts[0];
  const postCandidates = candidates.filter(c => c.postId === primaryPost.id);

  const counts = {};
  postCandidates.forEach(c => { counts[c.id] = 0; });

  electionVotes.forEach(vote => {
    if (vote.selections && vote.selections[primaryPost.id]) {
      const candId = vote.selections[primaryPost.id];
      if (counts[candId] !== undefined) {
        counts[candId]++;
      }
    }
  });

  const totalPostVotes = Object.values(counts).reduce((sum, v) => sum + v, 0);

  let html = `
    <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
      <h4 style="font-size: 1rem; color: var(--slate-700); font-weight: 700;">${Utils.escapeHtml(primaryPost.name)} Race</h4>
      <span class="badge badge-neutral">${totalPostVotes} votes cast</span>
    </div>
  `;

  postCandidates.forEach(c => {
    const voteCount = counts[c.id] || 0;
    const pct = totalPostVotes > 0 ? Math.round((voteCount / totalPostVotes) * 100) : 0;

    const symbolSrc = c.symbolPath?.startsWith('data:') ? c.symbolPath : `../${c.symbolPath || 'assets/symbols/torch.svg'}`;

    html += `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.9rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${symbolSrc}" style="width: 20px; height: 20px;" alt="${Utils.escapeHtml(c.name)}">
            <span style="font-weight: 600; color: var(--slate-800);">${Utils.escapeHtml(c.name)}</span>
          </div>
          <span style="font-weight: 700; color: var(--slate-900);">${voteCount} votes (${pct}%)</span>
        </div>
        <div class="progress-bar-container" style="height: 8px;">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Render Recent Activity Feed
 */
function renderRecentActivity(logs) {
  const feed = document.getElementById('recent-activity-feed');
  if (!feed) return;

  if (!logs || logs.length === 0) {
    feed.innerHTML = '<li style="padding: 1.5rem; text-align: center; color: var(--slate-400);">No recent activity recorded.</li>';
    return;
  }

  let html = '';
  logs.slice(0, 7).forEach(log => {
    let iconColor = 'var(--primary)';
    if (log.action.includes('Vote')) iconColor = 'var(--accent)';
    else if (log.action.includes('Delete')) iconColor = 'var(--danger)';

    html += `
      <li class="activity-item">
        <div class="activity-dot" style="background-color: ${iconColor};"></div>
        <div class="activity-content">
          <div class="activity-action">${Utils.escapeHtml(log.action)}</div>
          <div class="activity-detail">${Utils.escapeHtml(log.detail)}</div>
          <div class="activity-time">${Utils.formatDateTime(log.timestamp)} &bull; ${Utils.escapeHtml(log.user || 'system')}</div>
        </div>
      </li>
    `;
  });

  feed.innerHTML = html;
}
