/**
 * VoteSecure - Landing Page & Global UI Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Check login state on landing page to optionally show "Go to Dashboard" button
  const currentUser = Storage.getData('currentUser');
  const heroCta = document.querySelector('.hero-cta');
  if (currentUser && heroCta) {
    const dashboardUrl = currentUser.role === 'admin' ? 'pages/admin-dashboard.html' : 'pages/voter-dashboard.html';
    const resumeBtn = document.createElement('a');
    resumeBtn.href = dashboardUrl;
    resumeBtn.className = 'btn btn-accent btn-lg';
    resumeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
      Resume as ${Utils.escapeHtml(currentUser.name)} (${currentUser.role})
    `;
    heroCta.prepend(resumeBtn);
  }
});
