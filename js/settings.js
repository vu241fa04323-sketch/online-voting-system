/**
 * VoteSecure - System Settings & Administration Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('admin')) return;

  setupLayout();
  initSettings();
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

function initSettings() {
  loadAdminProfile();
  loadSystemSettings();
  setupEventListeners();
}

/**
 * Load current admin details
 */
function loadAdminProfile() {
  const admin = Storage.getData('admin', {
    username: 'admin',
    name: 'System Administrator',
    email: 'admin@votesecure.edu'
  });

  const usernameInput = document.getElementById('admin-username');
  const nameInput = document.getElementById('admin-name');
  const emailInput = document.getElementById('admin-email');

  if (usernameInput) usernameInput.value = admin.username || 'admin';
  if (nameInput) nameInput.value = admin.name || admin.fullName || 'System Administrator';
  if (emailInput) emailInput.value = admin.email || 'admin@votesecure.edu';
}

/**
 * Load current system & election settings
 */
function loadSystemSettings() {
  const settings = Storage.getSettings();

  const publicResultsToggle = document.getElementById('setting-allow-public-results');
  const instNameInput = document.getElementById('setting-inst-name');
  const electionYearInput = document.getElementById('setting-election-year');

  if (publicResultsToggle) {
    publicResultsToggle.checked = Boolean(settings.allowPublicResults);
  }
  if (instNameInput) {
    instNameInput.value = settings.institutionName || 'National Institute of Technology';
  }
  if (electionYearInput) {
    electionYearInput.value = settings.electionYear || '2026';
  }
}

function setupEventListeners() {
  // 1. Admin Profile Form
  const profileForm = document.getElementById('form-admin-profile');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const admin = Storage.getData('admin', {});
      const name = document.getElementById('admin-name').value.trim();
      const email = document.getElementById('admin-email').value.trim();

      if (!name) {
        Utils.showToast('Please enter an administrator name.', 'warning');
        return;
      }
      if (!email || !Utils.isValidEmail(email)) {
        Utils.showToast('Please enter a valid official email address.', 'warning');
        return;
      }

      admin.name = name;
      admin.fullName = name;
      admin.email = email;
      Storage.saveData('admin', admin);

      // Also update currentUser session if logged in
      const currentUser = Storage.getData('currentUser');
      if (currentUser && currentUser.role === 'admin') {
        currentUser.name = name;
        currentUser.email = email;
        Storage.saveData('currentUser', currentUser);
        Auth.updateUserDisplay();
      }

      Storage.addLog('Admin Profile Updated', `Admin profile updated: ${name} (${email})`, 'admin');
      Utils.showToast('Admin profile updated successfully!', 'success');
    });
  }

  // 2. Change Password Form
  const passwordForm = document.getElementById('form-admin-password');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const admin = Storage.getData('admin', { password: 'Admin@123' });
      const currentPw = document.getElementById('admin-current-password').value;
      const newPw = document.getElementById('admin-new-password').value;
      const confirmPw = document.getElementById('admin-confirm-password').value;

      if (!currentPw) {
        Utils.showToast('Please enter your current administrator password.', 'warning');
        return;
      }

      if (currentPw !== admin.password) {
        Utils.showToast('Current password is incorrect.', 'error');
        return;
      }

      if (newPw.length < 6) {
        Utils.showToast('New password must be at least 6 characters long.', 'warning');
        return;
      }

      if (newPw !== confirmPw) {
        Utils.showToast('New passwords do not match.', 'error');
        return;
      }

      admin.password = newPw;
      Storage.saveData('admin', admin);
      Storage.addLog('Password Changed', 'Administrator credentials were changed.', 'admin');

      passwordForm.reset();
      Utils.showToast('Administrator password updated successfully! Please remember your new password.', 'success', 4000);
    });
  }

  // 3. System & Election Settings Form
  const settingsForm = document.getElementById('form-system-settings');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentSettings = Storage.getSettings();

      const allowPublic = document.getElementById('setting-allow-public-results').checked;
      const instName = document.getElementById('setting-inst-name').value.trim();
      const electionYear = document.getElementById('setting-election-year').value.trim();

      const newSettings = {
        ...currentSettings,
        allowPublicResults: allowPublic,
        institutionName: instName || 'National Institute of Technology',
        electionYear: electionYear || '2026'
      };

      Storage.saveData('settings', newSettings);
      Storage.addLog('Settings Updated', `Results Public Visibility: ${allowPublic ? 'Enabled' : 'Admin Only'}`, 'admin');

      Utils.showToast('System configuration saved successfully!', 'success');
    });
  }

  // 4. Reset Demo Data Button
  const resetBtn = document.getElementById('btn-reset-demo-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Utils.confirmDialog({
        title: 'Reset Demo Data to Initial State',
        message: 'This will reset all elections, voters, posts, candidates, and ballot records back to the factory demo state. Any custom data created will be replaced. Proceed?',
        confirmText: 'Reset Database',
        cancelText: 'Cancel',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.resetDemoData();
          Utils.showToast('Demo data reset successfully to clean initial state!', 'success', 3500);
          setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
          }, 800);
        }
      });
    });
  }
}
