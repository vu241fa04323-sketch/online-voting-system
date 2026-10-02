/**
 * VoteSecure - Reusable Utilities
 * Toast notifications, custom modals, date formatters, CSV export, and validators.
 */

const Utils = {
  /**
   * Escape HTML to prevent basic XSS in injected strings
   */
  escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Format ISO date string into readable Date (e.g., "Oct 02, 2026")
   */
  formatDate(isoDateStr) {
    if (!isoDateStr) return 'N/A';
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) return isoDateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format ISO date string into readable Date & Time (e.g., "Oct 02, 2026, 10:30 AM")
   */
  formatDateTime(isoDateStr) {
    if (!isoDateStr) return 'N/A';
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) return isoDateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Generate sequential or random unique ID
   */
  generateId(prefix = 'ID') {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}${random}`;
  },

  /**
   * Validation helpers
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  isValidPhone(phone) {
    // Basic phone validation (allowing formatting characters)
    return phone && phone.trim().length >= 7;
  },

  /**
   * Toast Notification System
   * Creates toast notifications with smooth animations.
   * Types: 'success', 'error', 'warning', 'info'
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon according to type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
    } else {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${this.escapeHtml(message)}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', removeToast);
    container.appendChild(toast);

    setTimeout(removeToast, duration);
  },

  /**
   * Modal Dialog Management
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    const firstInput = modal.querySelector('input:not([type=hidden]), select, textarea, button.btn-primary');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    if (!document.querySelector('.modal.active')) {
      document.body.classList.remove('modal-open');
    }
  },

  /**
   * Custom Confirmation Dialog (Replaces browser window.confirm)
   */
  confirmDialog({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'btn-danger',
    onConfirm = () => {}
  }) {
    let confirmModal = document.getElementById('global-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'global-confirm-modal';
      confirmModal.className = 'modal';
      document.body.appendChild(confirmModal);
    }

    confirmModal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${this.escapeHtml(title)}</h3>
            <button class="modal-close" data-close-confirm>&times;</button>
          </div>
          <div class="modal-body">
            <p class="text-secondary">${this.escapeHtml(message)}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close-confirm>${this.escapeHtml(cancelText)}</button>
            <button type="button" class="btn ${confirmClass}" id="global-confirm-btn">${this.escapeHtml(confirmText)}</button>
          </div>
        </div>
      </div>
    `;

    const closeHandler = () => {
      confirmModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    };

    confirmModal.querySelectorAll('[data-close-confirm]').forEach(el => {
      el.addEventListener('click', closeHandler);
    });

    const backdrop = confirmModal.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeHandler);

    const confirmBtn = confirmModal.querySelector('#global-confirm-btn');
    confirmBtn.addEventListener('click', () => {
      closeHandler();
      if (typeof onConfirm === 'function') onConfirm();
    });

    confirmModal.classList.add('active');
    document.body.classList.add('modal-open');
    confirmBtn.focus();
  },

  /**
   * Export tabular data array to CSV and trigger file download
   */
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      this.showToast('No data available to export.', 'warning');
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    
    // Header row
    let csvContent = keys.join(separator) + '\n';

    // Data rows
    rows.forEach(row => {
      const rowContent = keys.map(key => {
        let cell = row[key] === null || row[key] === undefined ? '' : row[key].toString();
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(separator);
      csvContent += rowContent + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast(`Exported "${filename}" successfully!`, 'success');
    }
  }
};
