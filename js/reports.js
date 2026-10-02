/**
 * VoteSecure - Election Reports & Export Controller
 * Generates dynamic reports for:
 * 1. Election Report
 * 2. Voter List Report
 * 3. Candidate List Report
 * 4. Voting Participation Report
 * 5. Post-Wise Results
 * 6. Candidate Results
 * Features: View on screen, Print, Export to CSV, Filter by election.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initReports();
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

function initReports() {
  const elections = Storage.getData('elections', []);
  const electionSelect = document.getElementById('report-election-selector');
  const typeSelect = document.getElementById('report-type-selector');

  if (electionSelect) {
    electionSelect.innerHTML = '';
    elections.forEach(elec => {
      const opt = document.createElement('option');
      opt.value = elec.id;
      opt.textContent = `${elec.title} (${elec.status})`;
      if (elec.status === 'Active') opt.selected = true;
      electionSelect.appendChild(opt);
    });

    electionSelect.addEventListener('change', () => {
      renderCurrentReport();
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      renderCurrentReport();
    });
  }

  // Print button
  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // CSV Export button
  const csvBtn = document.getElementById('btn-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      exportCurrentReportCSV();
    });
  }

  // Initial render
  renderCurrentReport();
}

/**
 * Get current selected election and report type, then render
 */
function renderCurrentReport() {
  const electionSelect = document.getElementById('report-election-selector');
  const typeSelect = document.getElementById('report-type-selector');
  const container = document.getElementById('dynamic-report-container');
  const titleEl = document.getElementById('report-title-display');
  const dateEl = document.getElementById('report-generated-date');

  const elections = Storage.getData('elections', []);
  const electionId = electionSelect ? electionSelect.value : (elections[0]?.id || 'ELEC001');
  const election = elections.find(e => e.id === electionId) || elections[0];
  const reportType = typeSelect ? typeSelect.value : 'election';

  if (!container) return;

  if (dateEl) {
    dateEl.textContent = `Generated: ${Utils.formatDateTime(new Date().toISOString())} • Confidential System Report`;
  }

  if (!election) {
    container.innerHTML = `
      <div class="card p-4 text-center">
        <p class="text-muted">No election found to generate report. Please create an election first.</p>
      </div>
    `;
    return;
  }

  switch (reportType) {
    case 'election':
      if (titleEl) titleEl.textContent = `Election Comprehensive Report: ${election.title}`;
      renderElectionReport(container, election);
      break;
    case 'voters':
      if (titleEl) titleEl.textContent = `Official Voter List Report: ${election.title}`;
      renderVoterListReport(container, election);
      break;
    case 'candidates':
      if (titleEl) titleEl.textContent = `Nominated Candidate Directory: ${election.title}`;
      renderCandidateListReport(container, election);
      break;
    case 'participation':
      if (titleEl) titleEl.textContent = `Voter Turnout & Participation Audit: ${election.title}`;
      renderParticipationReport(container, election);
      break;
    case 'post-results':
      if (titleEl) titleEl.textContent = `Post-Wise Certified Results: ${election.title}`;
      renderPostWiseResultsReport(container, election);
      break;
    case 'cand-results':
      if (titleEl) titleEl.textContent = `Candidate Standings & Performance: ${election.title}`;
      renderCandidateResultsReport(container, election);
      break;
    default:
      renderElectionReport(container, election);
  }
}

/**
 * 1. ELECTION REPORT
 */
function renderElectionReport(container, election) {
  const voters = Storage.getData('voters', []);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);
  const posts = Storage.getData('posts', []).filter(p => p.electionId === election.id);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === election.id);

  const totalRegistered = voters.length;
  const totalEligible = voters.filter(v => v.status === 'Active').length;
  const totalCast = votes.length;
  const turnoutRate = totalEligible > 0 ? ((totalCast / totalEligible) * 100).toFixed(1) : '0.0';

  // Department map
  const deptMap = {};
  voters.forEach(v => {
    const d = v.department || 'General';
    if (!deptMap[d]) deptMap[d] = { total: 0, voted: 0 };
    deptMap[d].total++;
    if (votes.some(vt => (vt.voterId === v.id || vt.voterId === v.userId))) {
      deptMap[d].voted++;
    }
  });

  let deptRowsHtml = '';
  Object.keys(deptMap).sort().forEach(dept => {
    const data = deptMap[dept];
    const pct = data.total > 0 ? ((data.voted / data.total) * 100).toFixed(1) : '0.0';
    deptRowsHtml += `
      <tr>
        <td><strong>${Utils.escapeHtml(dept)}</strong></td>
        <td>${data.total}</td>
        <td>${data.voted}</td>
        <td>${data.total - data.voted}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${pct}%</span>
            <div style="flex: 1; height: 6px; background: var(--slate-200); border-radius: 999px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: var(--accent);"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <!-- Election Summary Card -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title">Executive Summary &amp; Status</h3>
        <span class="badge ${election.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${election.status}</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <tbody>
            <tr>
              <td style="width: 20%;"><strong>Election Title</strong></td>
              <td style="width: 30%;">${Utils.escapeHtml(election.title)}</td>
              <td style="width: 20%;"><strong>Election ID</strong></td>
              <td style="width: 30%; font-family: var(--font-mono);">${Utils.escapeHtml(election.id)}</td>
            </tr>
            <tr>
              <td><strong>Voting Window</strong></td>
              <td>${Utils.formatDate(election.startDate)} ${election.startTime || ''} &ndash; ${Utils.formatDate(election.endDate)} ${election.endTime || ''}</td>
              <td><strong>Status</strong></td>
              <td><span class="badge ${election.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${election.status}</span></td>
            </tr>
            <tr>
              <td><strong>Registered Voters</strong></td>
              <td>${totalRegistered} (Active Eligible: ${totalEligible})</td>
              <td><strong>Total Ballots Cast</strong></td>
              <td><strong>${totalCast}</strong> (${turnoutRate}% turnout)</td>
            </tr>
            <tr>
              <td><strong>Electoral Posts</strong></td>
              <td>${posts.length} Contested Posts</td>
              <td><strong>Total Candidates</strong></td>
              <td>${candidates.length} Approved Nominees</td>
            </tr>
            <tr>
              <td><strong>Description</strong></td>
              <td colspan="3">${Utils.escapeHtml(election.description || 'No description provided.')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Department Turnout Analysis Card -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title">Department-Wise Turnout Breakdown</h3>
        <span class="badge badge-primary">Demographic Audit</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Department / Faculty</th>
              <th>Registered</th>
              <th>Ballots Cast</th>
              <th>Did Not Vote</th>
              <th>Turnout %</th>
            </tr>
          </thead>
          <tbody>
            ${deptRowsHtml || '<tr><td colspan="5" class="text-center py-4 text-muted">No department records available.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 2. VOTER LIST REPORT
 */
function renderVoterListReport(container, election) {
  const voters = Storage.getData('voters', []);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);

  let rowsHtml = '';
  voters.forEach((v, idx) => {
    const hasVoted = votes.some(vt => vt.voterId === v.id || vt.voterId === v.userId);
    const voteRecord = votes.find(vt => vt.voterId === v.id || vt.voterId === v.userId);

    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(v.id || v.userId)}</td>
        <td><strong>${Utils.escapeHtml(v.name)}</strong></td>
        <td>${Utils.escapeHtml(v.studentId || 'N/A')}</td>
        <td>${Utils.escapeHtml(v.department || 'N/A')}</td>
        <td>${Utils.escapeHtml(v.year || '-')} ${v.section ? `(${Utils.escapeHtml(v.section)})` : ''}</td>
        <td>${Utils.escapeHtml(v.email || 'N/A')}</td>
        <td>${Utils.escapeHtml(v.phone || 'N/A')}</td>
        <td>
          <span class="badge ${v.status === 'Active' ? 'badge-success' : 'badge-danger'}">
            ${v.status || 'Active'}
          </span>
        </td>
        <td>
          ${hasVoted 
            ? `<span class="badge badge-success">Voted</span>` 
            : `<span class="badge badge-neutral">Not Voted</span>`}
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Official Voter Register</h3>
          <p style="font-size: 0.85rem; color: var(--slate-500); margin: 0;">Total Registered Voters: ${voters.length}</p>
        </div>
        <span class="badge badge-neutral">Confidential Registry</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Student/Emp ID</th>
              <th>Department</th>
              <th>Class/Sec</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Account</th>
              <th>Ballot Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" class="text-center py-4 text-muted">No voters found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 3. CANDIDATE LIST REPORT
 */
function renderCandidateListReport(container, election) {
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === election.id);
  const posts = Storage.getData('posts', []).filter(p => p.electionId === election.id);

  let rowsHtml = '';
  candidates.forEach((cand, idx) => {
    const post = posts.find(p => p.id === cand.postId) || { name: 'Executive Post' };

    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(cand.id)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${cand.photo || '../assets/images/default-avatar.svg'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--slate-200);" alt="${Utils.escapeHtml(cand.name)}">
            <strong>${Utils.escapeHtml(cand.name)}</strong>
          </div>
        </td>
        <td><span class="badge badge-primary">${Utils.escapeHtml(post.name)}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${cand.symbol ? `<img src="${cand.symbol}" style="width: 24px; height: 24px; object-fit: contain;" alt="Symbol">` : ''}
            <span>${Utils.escapeHtml(cand.symbolName || 'Official Symbol')}</span>
          </div>
        </td>
        <td>${Utils.escapeHtml(cand.department || 'General')}</td>
        <td style="font-size: 0.85rem; color: var(--slate-600); max-width: 260px;">${Utils.escapeHtml(cand.description || 'No manifesto summary.')}</td>
        <td><span class="badge ${cand.status === 'Active' ? 'badge-success' : 'badge-danger'}">${cand.status || 'Active'}</span></td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Official Candidate Nominations Directory</h3>
          <p style="font-size: 0.85rem; color: var(--slate-500); margin: 0;">Total Approved Candidates: ${candidates.length}</p>
        </div>
        <span class="badge badge-neutral">Nomination Audit</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Candidate ID</th>
              <th>Candidate Name</th>
              <th>Contested Post</th>
              <th>Electoral Symbol</th>
              <th>Department</th>
              <th>Manifesto / Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" class="text-center py-4 text-muted">No candidates registered for this election.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 4. VOTING PARTICIPATION REPORT
 */
function renderParticipationReport(container, election) {
  const voters = Storage.getData('voters', []);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);

  const totalRegistered = voters.length;
  const totalEligible = voters.filter(v => v.status === 'Active').length;
  const votedCount = votes.length;
  const notVotedCount = Math.max(0, totalEligible - votedCount);
  const participationRate = totalEligible > 0 ? ((votedCount / totalEligible) * 100).toFixed(1) : '0.0';

  let rowsHtml = '';
  voters.forEach((v, idx) => {
    const voteRecord = votes.find(vt => vt.voterId === v.id || vt.voterId === v.userId);
    const hasVoted = Boolean(voteRecord);

    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${Utils.escapeHtml(v.id || v.userId)}</td>
        <td><strong>${Utils.escapeHtml(v.name)}</strong></td>
        <td>${Utils.escapeHtml(v.studentId || '-')}</td>
        <td>${Utils.escapeHtml(v.department || 'General')}</td>
        <td>
          ${hasVoted 
            ? '<span class="badge badge-success"><span class="badge-dot"></span> Voted</span>' 
            : '<span class="badge badge-neutral">Not Voted</span>'}
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--slate-700);">
          ${hasVoted ? Utils.escapeHtml(voteRecord.id) : '&mdash;'}
        </td>
        <td style="font-size: 0.85rem;">
          ${hasVoted ? Utils.formatDateTime(voteRecord.timestamp) : '&mdash;'}
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <!-- High-level turnout metrics -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="card p-3" style="text-align: center;">
        <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase;">Total Eligible Voters</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--slate-800);">${totalEligible}</div>
      </div>
      <div class="card p-3" style="text-align: center;">
        <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase;">Ballots Cast</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent);">${votedCount}</div>
      </div>
      <div class="card p-3" style="text-align: center;">
        <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase;">Yet to Vote</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--slate-600);">${notVotedCount}</div>
      </div>
      <div class="card p-3" style="text-align: center;">
        <div style="font-size: 0.8rem; color: var(--slate-500); text-transform: uppercase;">Participation Rate</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${participationRate}%</div>
      </div>
    </div>

    <!-- Participation Ledger Card -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Voter Participation Ledger</h3>
        <span class="badge badge-primary">Audit Log</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>User ID</th>
              <th>Voter Name</th>
              <th>Student ID</th>
              <th>Department</th>
              <th>Status</th>
              <th>Confirmation Code</th>
              <th>Cast Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" class="text-center py-4 text-muted">No voters recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 5. POST-WISE RESULTS REPORT
 */
function renderPostWiseResultsReport(container, election) {
  const posts = Storage.getData('posts', []).filter(p => p.electionId === election.id);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === election.id);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="card p-4 text-center">
        <p class="text-muted">No posts found for this election.</p>
      </div>
    `;
    return;
  }

  let html = '';

  posts.forEach(post => {
    const postCandidates = candidates.filter(c => c.postId === post.id);

    // Calculate tally
    const tally = {};
    postCandidates.forEach(c => { tally[c.id] = 0; });

    votes.forEach(vote => {
      if (vote.selections && vote.selections[post.id]) {
        const candId = vote.selections[post.id];
        if (tally[candId] !== undefined) {
          tally[candId]++;
        }
      }
    });

    const totalPostVotes = Object.values(tally).reduce((sum, v) => sum + v, 0);
    const sorted = [...postCandidates].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0));

    let candRows = '';
    sorted.forEach((cand, idx) => {
      const vCount = tally[cand.id] || 0;
      const pct = totalPostVotes > 0 ? ((vCount / totalPostVotes) * 100).toFixed(1) : '0.0';
      const isWinner = idx === 0 && vCount > 0;

      candRows += `
        <tr>
          <td>
            <strong>#${idx + 1}</strong>
            ${isWinner ? ' <span class="winner-badge">Winner / Leader</span>' : ''}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${cand.photo || '../assets/images/default-avatar.svg'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="">
              <strong>${Utils.escapeHtml(cand.name)}</strong>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${cand.symbol ? `<img src="${cand.symbol}" style="width: 20px; height: 20px; object-fit: contain;" alt="">` : ''}
              <span>${Utils.escapeHtml(cand.symbolName || 'Official Symbol')}</span>
            </div>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; font-size: 1.05rem;">${vCount}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <strong style="min-width: 45px;">${pct}%</strong>
              <div style="flex: 1; height: 8px; background: var(--slate-200); border-radius: 999px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: ${isWinner ? 'var(--accent)' : 'var(--primary)'};"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Post: ${Utils.escapeHtml(post.name)}</h3>
            <p style="font-size: 0.85rem; color: var(--slate-500); margin: 0;">Total Ballots Cast for Post: ${totalPostVotes}</p>
          </div>
          <span class="badge badge-primary">Tally Complete</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 15%;">Standing</th>
                <th style="width: 30%;">Candidate</th>
                <th style="width: 20%;">Electoral Symbol</th>
                <th style="width: 15%;">Votes Received</th>
                <th style="width: 20%;">Share (%)</th>
              </tr>
            </thead>
            <tbody>
              ${candRows || '<tr><td colspan="5" class="text-center py-3 text-muted">No candidates assigned to this post.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * 6. CANDIDATE RESULTS REPORT
 */
function renderCandidateResultsReport(container, election) {
  const posts = Storage.getData('posts', []).filter(p => p.electionId === election.id);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === election.id);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);

  // Build candidate standings
  const candidateStats = [];

  posts.forEach(post => {
    const postCandidates = candidates.filter(c => c.postId === post.id);
    const tally = {};
    postCandidates.forEach(c => { tally[c.id] = 0; });

    votes.forEach(vote => {
      if (vote.selections && vote.selections[post.id]) {
        const candId = vote.selections[post.id];
        if (tally[candId] !== undefined) {
          tally[candId]++;
        }
      }
    });

    const totalPostVotes = Object.values(tally).reduce((sum, v) => sum + v, 0);
    const sorted = [...postCandidates].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0));
    const highestVotes = sorted.length > 0 ? (tally[sorted[0].id] || 0) : 0;

    sorted.forEach((cand, idx) => {
      const vCount = tally[cand.id] || 0;
      const share = totalPostVotes > 0 ? ((vCount / totalPostVotes) * 100).toFixed(1) : '0.0';
      const isLeader = idx === 0 && vCount > 0;
      const margin = isLeader 
        ? (sorted.length > 1 ? vCount - (tally[sorted[1].id] || 0) : vCount) 
        : (vCount - highestVotes);

      candidateStats.push({
        candidate: cand,
        postName: post.name,
        votes: vCount,
        share: share,
        rank: idx + 1,
        isLeader: isLeader,
        margin: margin
      });
    });
  });

  let rowsHtml = '';
  candidateStats.forEach((stat, idx) => {
    rowsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${stat.candidate.photo || '../assets/images/default-avatar.svg'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="">
            <div>
              <strong>${Utils.escapeHtml(stat.candidate.name)}</strong>
              <div style="font-size: 0.75rem; color: var(--slate-500); font-family: var(--font-mono);">${Utils.escapeHtml(stat.candidate.id)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-primary">${Utils.escapeHtml(stat.postName)}</span></td>
        <td>${Utils.escapeHtml(stat.candidate.symbolName || 'Standard')}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem; color: var(--slate-900);">${stat.votes}</td>
        <td><strong>${stat.share}%</strong></td>
        <td>
          ${stat.isLeader 
            ? `<span class="badge badge-success">Leader (+${stat.margin})</span>` 
            : `<span style="color: var(--danger); font-size: 0.85rem; font-weight: 600;">${stat.margin}</span>`}
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Candidate Comprehensive Standings</h3>
          <p style="font-size: 0.85rem; color: var(--slate-500); margin: 0;">Comparative ballot counts and victory margins</p>
        </div>
        <span class="badge badge-primary">Certified Tally</span>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Candidate</th>
              <th>Post</th>
              <th>Symbol</th>
              <th>Total Votes</th>
              <th>Vote Share</th>
              <th>Margin vs Leader</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" class="text-center py-4 text-muted">No candidate data available.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Export current selected report to CSV
 */
function exportCurrentReportCSV() {
  const electionSelect = document.getElementById('report-election-selector');
  const typeSelect = document.getElementById('report-type-selector');

  const elections = Storage.getData('elections', []);
  const electionId = electionSelect ? electionSelect.value : (elections[0]?.id || 'ELEC001');
  const election = elections.find(e => e.id === electionId) || elections[0];
  const reportType = typeSelect ? typeSelect.value : 'election';

  if (!election) {
    Utils.showToast('Please select an election to export.', 'warning');
    return;
  }

  const sanitizedTitle = (election.title || 'election').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const voters = Storage.getData('voters', []);
  const votes = Storage.getData('votes', []).filter(v => v.electionId === election.id);
  const posts = Storage.getData('posts', []).filter(p => p.electionId === election.id);
  const candidates = Storage.getData('candidates', []).filter(c => c.electionId === election.id);

  let rows = [];
  let filename = `votesecure_${reportType}_${sanitizedTitle}.csv`;

  switch (reportType) {
    case 'election': {
      const deptMap = {};
      voters.forEach(v => {
        const d = v.department || 'General';
        if (!deptMap[d]) deptMap[d] = { total: 0, voted: 0 };
        deptMap[d].total++;
        if (votes.some(vt => vt.voterId === v.id || vt.voterId === v.userId)) {
          deptMap[d].voted++;
        }
      });

      Object.keys(deptMap).sort().forEach(dept => {
        const data = deptMap[dept];
        const pct = data.total > 0 ? ((data.voted / data.total) * 100).toFixed(1) : '0.0';
        rows.push({
          'Election ID': election.id,
          'Election Title': election.title,
          'Election Status': election.status,
          'Department': dept,
          'Total Registered Voters': data.total,
          'Ballots Cast': data.voted,
          'Turnout Rate (%)': `${pct}%`,
          'Export Date': new Date().toISOString()
        });
      });
      break;
    }

    case 'voters': {
      voters.forEach((v, idx) => {
        const hasVoted = votes.some(vt => vt.voterId === v.id || vt.voterId === v.userId);
        rows.push({
          'Serial No': idx + 1,
          'User ID': v.id || v.userId,
          'Full Name': v.name,
          'Student / Emp ID': v.studentId || '',
          'Department': v.department || '',
          'Class / Year': v.year || '',
          'Section': v.section || '',
          'Email': v.email || '',
          'Phone': v.phone || '',
          'Account Status': v.status || 'Active',
          'Voted in this Election': hasVoted ? 'YES' : 'NO'
        });
      });
      break;
    }

    case 'candidates': {
      candidates.forEach((cand, idx) => {
        const post = posts.find(p => p.id === cand.postId) || { name: 'Executive Post' };
        rows.push({
          'Serial No': idx + 1,
          'Candidate ID': cand.id,
          'Candidate Name': cand.name,
          'Contested Post': post.name,
          'Electoral Symbol': cand.symbolName || 'Official Symbol',
          'Department': cand.department || 'General',
          'Status': cand.status || 'Active',
          'Description / Manifesto': cand.description || ''
        });
      });
      break;
    }

    case 'participation': {
      voters.forEach((v, idx) => {
        const voteRecord = votes.find(vt => vt.voterId === v.id || vt.voterId === v.userId);
        rows.push({
          'Serial No': idx + 1,
          'User ID': v.id || v.userId,
          'Voter Name': v.name,
          'Student / Emp ID': v.studentId || '',
          'Department': v.department || '',
          'Participation Status': voteRecord ? 'VOTED' : 'NOT VOTED',
          'Confirmation Number': voteRecord ? voteRecord.id : 'N/A',
          'Timestamp': voteRecord ? voteRecord.timestamp : 'N/A'
        });
      });
      break;
    }

    case 'post-results':
    case 'cand-results': {
      posts.forEach(post => {
        const postCandidates = candidates.filter(c => c.postId === post.id);
        const tally = {};
        postCandidates.forEach(c => { tally[c.id] = 0; });

        votes.forEach(vote => {
          if (vote.selections && vote.selections[post.id]) {
            const candId = vote.selections[post.id];
            if (tally[candId] !== undefined) {
              tally[candId]++;
            }
          }
        });

        const totalPostVotes = Object.values(tally).reduce((sum, v) => sum + v, 0);
        const sorted = [...postCandidates].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0));

        sorted.forEach((cand, idx) => {
          const vCount = tally[cand.id] || 0;
          const share = totalPostVotes > 0 ? ((vCount / totalPostVotes) * 100).toFixed(2) : '0.00';
          rows.push({
            'Election ID': election.id,
            'Election Title': election.title,
            'Post Name': post.name,
            'Standing Rank': idx + 1,
            'Candidate ID': cand.id,
            'Candidate Name': cand.name,
            'Electoral Symbol': cand.symbolName || 'Official Symbol',
            'Votes Received': vCount,
            'Vote Share (%)': `${share}%`,
            'Total Post Votes': totalPostVotes,
            'Export Date': new Date().toISOString()
          });
        });
      });
      break;
    }
  }

  Utils.exportToCSV(filename, rows);
}
