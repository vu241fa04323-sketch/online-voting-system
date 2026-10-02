/**
 * VoteSecure - Authentication & Role-Based Access Control Simulation
 * 
 * NOTE: For this educational prototype, authentication and role checks are simulated
 * using browser LocalStorage. In a real-world system, tokens (JWT/sessions) and secure
 * server-side authorization must be enforced.
 */

const Auth = {
  /**
   * Get current authenticated user session
   */
  getCurrentUser() {
    return Storage.getData('currentUser', null);
  },

  /**
   * Check if a user is currently logged in
   */
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  /**
   * Check if logged in user is admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * Check if logged in user is voter
   */
  isVoter() {
    const user = this.getCurrentUser();
    return user && user.role === 'voter';
  },

  /**
   * Admin Login Simulation
   */
  loginAdmin(username, password) {
    const admin = Storage.getData('admin');
    if (!admin) {
      return { success: false, message: 'Admin account not found in system.' };
    }

    if (username.trim() === admin.username && password === admin.password) {
      const sessionUser = {
        id: 'admin',
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        loginTime: new Date().toISOString()
      };
      Storage.saveData('currentUser', sessionUser);
      Storage.addLog('Admin Login', `Admin ${admin.username} logged into the system.`, 'admin');
      return { success: true, user: sessionUser };
    }

    return { success: false, message: 'Invalid admin username or password.' };
  },

  /**
   * Voter Login Simulation
   */
  loginVoter(voterId, password) {
    const voters = Storage.getData('voters', []);
    const cleanId = (voterId || '').trim();

    const voter = voters.find(v => 
      (v.id && v.id.toLowerCase() === cleanId.toLowerCase()) || 
      (v.userId && v.userId.toLowerCase() === cleanId.toLowerCase())
    );

    if (!voter) {
      return { success: false, message: 'User ID not found. Please contact the administrator to receive your User ID and password.' };
    }

    if (voter.status !== 'Active') {
      return { success: false, message: 'Your voter account is Inactive/Suspended. Please contact the administrator.' };
    }

    if (voter.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    const sessionUser = {
      id: voter.id || voter.userId,
      userId: voter.userId || voter.id,
      name: voter.fullName || voter.name,
      fullName: voter.fullName || voter.name,
      email: voter.email,
      department: voter.department,
      phone: voter.phone,
      studentId: voter.studentId,
      year: voter.year,
      section: voter.section,
      role: 'voter',
      loginTime: new Date().toISOString()
    };

    Storage.saveData('currentUser', sessionUser);
    Storage.addLog('Voter Login', `Voter ${sessionUser.id} (${sessionUser.name}) logged in.`, sessionUser.id);
    return { success: true, user: sessionUser };
  },

  /**
   * Logout user and redirect to appropriate login or landing page
   */
  logout(redirectUrl = '../index.html') {
    const user = this.getCurrentUser();
    if (user) {
      Storage.addLog('User Logout', `${user.name} (${user.role}) logged out.`, user.id);
    }
    Storage.clearData('currentUser');
    window.location.href = redirectUrl;
  },

  /**
   * Enforce Role-Based Route Protection
   * Redirects unauthorized visits.
   */
  requireRole(requiredRole) {
    const user = this.getCurrentUser();
    
    // Determine path prefix based on whether current page is in /pages/ or root
    const isInPages = window.location.pathname.includes('/pages/') || 
                      (!window.location.pathname.endsWith('index.html') && 
                       !window.location.pathname.endsWith('/'));

    const adminLoginUrl = isInPages ? 'admin-login.html' : 'pages/admin-login.html';
    const voterLoginUrl = isInPages ? 'voter-login.html' : 'pages/voter-login.html';

    if (!user) {
      // Not logged in
      if (requiredRole === 'admin') {
        window.location.href = adminLoginUrl;
      } else {
        window.location.href = voterLoginUrl;
      }
      return false;
    }

    if (user.role !== requiredRole) {
      // Role mismatch
      if (requiredRole === 'admin') {
        window.location.href = adminLoginUrl;
      } else {
        window.location.href = voterLoginUrl;
      }
      return false;
    }

    return true;
  },

  /**
   * Automatically populate user profile details and hook up logout buttons in DOM
   */
  setupUI() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Display user name in DOM elements with class 'user-display-name'
    document.querySelectorAll('.user-display-name').forEach(el => {
      el.textContent = user.name;
    });

    // Display user ID
    document.querySelectorAll('.user-display-id').forEach(el => {
      el.textContent = user.id;
    });

    // Display role badge
    document.querySelectorAll('.user-display-role').forEach(el => {
      el.textContent = user.role.toUpperCase();
    });

    // Setup logout buttons
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Utils.confirmDialog({
          title: 'Sign Out',
          message: 'Are you sure you want to end your current session?',
          confirmText: 'Sign Out',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            const redirect = user.role === 'admin' ? 'admin-login.html' : 'voter-login.html';
            Auth.logout(redirect);
          }
        });
      });
    });
  }
};

// Setup UI once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.setupUI();
});
