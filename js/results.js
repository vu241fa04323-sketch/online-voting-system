/**
 * VoteSecure - Results & Dynamic Visualization Controller
 * Dynamically computes votes, turnout percentages, post-wise candidate standings,
 * horizontal animated bar charts, progress bars, and winner badges.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'admin-login.html';
    return;
  }

  setupResultsLayout();
  initResultsPage();
});

function setupResultsLayout() {
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

  // Render Role-Appropriate Sidebar (Section 26 & 27)
  renderSidebarForRole();
}

function renderSidebarForRole() {
  const user = Auth.getCurrentUser();
  const isAdmin = user && user.role === 'admin';

  const badgeEl = document.getElementById('sidebar-role-badge');
  if (badgeEl) badgeEl.textContent = isAdmin ? 'Admin' : 'Voter';

  const footerRole = document.getElementById('footer-user-role');
  if (footerRole) footerRole.textContent = isAdmin ? 'Administrator' : 'Student Voter';

  const footerAvatar = document.getElementById('footer-user-avatar');
  if (footerAvatar) footerAvatar.textContent = isAdmin ? 'AD' : 'VT';

  const brandLink = document.getElementById('brand-dashboard-link');
  if (brandLink) brandLink.href = isAdmin ? 'admin-dashboard.html' : 'voter-dashboard.html';

  const navContainer = document.getElementById('sidebar-nav-container');
  if (!navContainer) return;

  if (isAdmin) {
    // Admin Sidebar (Section 26)
    navContainer.innerHTML = `
      <div class="sidebar-heading">Navigation</div>
      <a href="admin-dashboard.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
        <span>Dashboard</span>
      </a>
      <a href="elections.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
        <span>Elections</span>
      </a>
      <a href="posts.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
        <span>Posts</span>
      </a>
      <a href="voters.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
        <span>Voters</span>
      </a>
      <a href="candidates.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
        <span>Candidates</span>
      </a>

      <div class="sidebar-heading">Analytics &amp; Tools</div>
      <a href="results.html" class="nav-item active">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
        <span>Results</span>
      </a>
      <a href="reports.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
        <span>Reports</span>
      </a>
      <a href="settings.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
        <span>Settings</span>
      </a>
    `;
  } else {
    // Voter Sidebar (Section 27: Dashboard, Active Election, My Voting Status, Profile, Logout)
    navContainer.innerHTML = `
      <div class="sidebar-heading">Voter Navigation</div>
      <a href="voter-dashboard.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
        <span>Dashboard</span>
      </a>
      <a href="voting.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span>Active Election</span>
      </a>
      <a href="profile.html#history" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
        <span>My Voting Status</span>
      </a>
      <a href="profile.html" class="nav-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
        <span>Profile</span>
      </a>
    `;
  }
}

function initResultsPage() {
  const user = Auth.getCurrentUser();
  const isAdmin = user && user.role === 'admin';
  const isPublicAllowed = Storage.isPublicResultsAllowed();

  // Access Control check (Section 22: only admin unless explicitly public)
  if (!isAdmin && !isPublicAllowed) {
    document.getElementById('results-restricted-container').style.display = 'block';
    document.getElementById('results-authorized-view').style.display = 'none';
    return;
  }

  const elections = Storage.getData('elections', []);
  const selectEl = document.getElementById('results-election-selector');

  if (selectEl) {
    selectEl.innerHTML = '';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = `${elec.title || elec.name} (${elec.status})`;
      if (elec.status === 'Active') opt.selected = true;
      selectEl.appendChild(opt);
    });

    selectEl.addEventListener('change', () => {
      renderElectionResults(selectEl.value);
    });
  }

  const initialElectionId = selectEl ? selectEl.value : (elections[0]?.id || 'ELECTION001');
  renderElectionResults(initialElectionId);
}

/**
 * Calculate dynamic results and render Section 22 Overall Statistics + Section 23/24 Post Results
 */
function renderElectionResults(electionId) {
  const elections = Storage.getData('elections', []);
  const voters = Storage.getData('voters', []);
  const votes = Storage.getData('votes', []);
  const posts = Storage.getData('posts', []).filter(p => p.electionId === electionId);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === electionId);

  const election = elections.find(e => e.id === electionId);
  if (!election) return;

  posts.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Votes for this election
  const electionVotes = votes.filter(v => v.electionId === electionId);
  const totalRegisteredVoters = voters.length;
  const activeEligibleVoters = voters.filter(v => v.status === 'Active').length;
  const totalVotesCast = electionVotes.length;
  const totalNotVoted = Math.max(0, activeEligibleVoters - totalVotesCast);
  const participationPct = activeEligibleVoters > 0 
    ? Math.round((totalVotesCast / activeEligibleVoters) * 100) 
    : 0;

  // 1. Overall Statistics (Section 22)
  const nameEl = document.getElementById('results-election-name');
  if (nameEl) nameEl.textContent = election.title || election.name;

  const totalVotersEl = document.getElementById('results-total-voters');
  if (totalVotersEl) totalVotersEl.textContent = totalRegisteredVoters;

  const activeSubEl = document.getElementById('results-active-sub');
  if (activeSubEl) activeSubEl.textContent = `${activeEligibleVoters} Active Eligible`;

  const votesCastEl = document.getElementById('results-votes-cast');
  if (votesCastEl) votesCastEl.textContent = totalVotesCast;

  const notVotedEl = document.getElementById('results-not-voted');
  if (notVotedEl) notVotedEl.textContent = totalNotVoted;

  const partPctEl = document.getElementById('results-participation-pct');
  if (partPctEl) partPctEl.textContent = `${participationPct}%`;

  const statusDisplayEl = document.getElementById('results-election-status-display');
  if (statusDisplayEl) {
    statusDisplayEl.innerHTML = `
      <span class="badge ${election.status === 'Active' ? 'badge-success' : 'badge-neutral'}">
        ${election.status === 'Active' ? '<span class="badge-dot"></span>' : ''} ${election.status}
      </span>
    `;
  }

  const scheduleSubEl = document.getElementById('results-schedule-sub');
  if (scheduleSubEl) {
    scheduleSubEl.textContent = election.startDate ? `${Utils.formatDate(election.startDate)} – ${Utils.formatDate(election.endDate)}` : 'Electoral event';
  }

  const turnoutLabel = document.getElementById('results-turnout-label');
  if (turnoutLabel) turnoutLabel.textContent = `${totalVotesCast} of ${activeEligibleVoters} active voters (${participationPct}%)`;

  const turnoutBar = document.getElementById('results-turnout-bar');
  if (turnoutBar) turnoutBar.style.width = `${participationPct}%`;

  // 2. Results by Post (Section 23 & 24)
  const container = document.getElementById('results-posts-container');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">No electoral posts configured for this election.</p>';
    return;
  }

  let html = '';

  posts.forEach(post => {
    const postCandidates = candidates.filter(c => c.postId === post.id);

    // Calculate votes for each candidate in this post dynamically
    const tally = {};
    postCandidates.forEach(c => { tally[c.id] = 0; });

    electionVotes.forEach(vote => {
      if (vote.selections && vote.selections[post.id]) {
        const candId = vote.selections[post.id];
        if (tally[candId] !== undefined) {
          tally[candId]++;
        }
      }
    });

    const totalPostVotes = Object.values(tally).reduce((sum, v) => sum + v, 0);

    // Identify leader
    let maxVotes = -1;
    postCandidates.forEach(c => {
      const v = tally[c.id] || 0;
      if (v > maxVotes) maxVotes = v;
    });

    // Sort descending by vote count
    const sortedCandidates = [...postCandidates].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0));

    // Construct table rows (Section 23 format)
    let tableRows = '';
    sortedCandidates.forEach(c => {
      const v = tally[c.id] || 0;
      const pct = totalPostVotes > 0 ? ((v / totalPostVotes) * 100).toFixed(1) : '0.0';
      const isLeader = v === maxVotes && v > 0;
      const symbolSrc = c.symbolPath?.startsWith('data:') ? c.symbolPath : `../${c.symbolPath || 'assets/symbols/torch.svg'}`;

      tableRows += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-weight: 700; color: var(--slate-900); font-size: 0.95rem;">
                ${Utils.escapeHtml(c.name)}
              </span>
              ${isLeader ? `<span class="badge badge-success" style="font-size: 0.7rem;">${election.status === 'Completed' ? '🏆 Winner' : '⚡ Leading'}</span>` : ''}
            </div>
            <div style="font-size: 0.75rem; color: var(--slate-500); font-family: var(--font-mono);">${Utils.escapeHtml(c.id)}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${symbolSrc}" style="width: 24px; height: 24px; object-fit: contain;" alt="${Utils.escapeHtml(c.symbolName || 'Symbol')}">
              <span style="font-size: 0.85rem; color: var(--slate-700);">${Utils.escapeHtml(c.symbolName || 'Symbol')}</span>
            </div>
          </td>
          <td style="font-weight: 800; font-size: 1.05rem; text-align: right; color: var(--slate-900);">
            ${v}
          </td>
          <td style="font-weight: 800; font-size: 1.05rem; text-align: right; color: var(--primary);">
            ${pct}%
          </td>
        </tr>
      `;
    });

    // Construct Visualizations (Section 24: Horizontal bar charts, candidate cards, progress bars)
    let visualBars = '';
    sortedCandidates.forEach(c => {
      const v = tally[c.id] || 0;
      const pct = totalPostVotes > 0 ? Math.round((v / totalPostVotes) * 100) : 0;
      const isLeader = v === maxVotes && v > 0;
      const barColor = isLeader ? 'var(--accent)' : 'var(--primary)';
      const symbolSrc = c.symbolPath?.startsWith('data:') ? c.symbolPath : `../${c.symbolPath || 'assets/symbols/torch.svg'}`;

      visualBars += `
        <div style="margin-bottom: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.9rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${symbolSrc}" style="width: 20px; height: 20px; object-fit: contain;" alt="">
              <span style="font-weight: 700; color: var(--slate-800);">${Utils.escapeHtml(c.name)}</span>
              ${isLeader ? `<span class="badge badge-success" style="font-size: 0.68rem;">${election.status === 'Completed' ? 'Winner' : 'Leading'}</span>` : ''}
            </div>
            <div style="font-weight: 800; color: var(--slate-900);">
              ${v} <span style="font-weight: 500; color: var(--slate-500); font-size: 0.82rem;">votes</span> (${pct}%)
            </div>
          </div>
          <!-- Horizontal Animated Bar Chart (Pure CSS) -->
          <div class="progress-bar-container" style="height: 14px; background: var(--slate-100); border-radius: var(--radius-full); overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: ${barColor}; transition: width 0.8s ease-in-out; border-radius: var(--radius-full);"></div>
          </div>
        </div>
      `;
    });

    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin: 0 0 0.2rem;">
              POST: ${Utils.escapeHtml(post.name.toUpperCase())}
            </h3>
            <span style="font-size: 0.82rem; color: var(--slate-500);">${Utils.escapeHtml(post.description || 'Electoral Executive Office')}</span>
          </div>
          <span class="badge badge-primary">${totalPostVotes} Total Votes Cast</span>
        </div>

        <div class="card-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <!-- Column 1: Official Standings Table (Section 23) -->
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-700); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
                Official Ballot Standings
              </h4>
              <div class="table-responsive">
                <table class="table" style="font-size: 0.9rem;">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Symbol</th>
                      <th style="text-align: right;">Votes</th>
                      <th style="text-align: right;">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Column 2: Visual Chart & Percentage Indicators (Section 24) -->
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-700); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">
                Vote Distribution &amp; Turnout Visualization
              </h4>
              <div style="background: var(--white); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); padding: 1.25rem;">
                ${visualBars}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
