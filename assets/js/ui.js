/**
 * NetTools BR - UI Rendering Helpers
 */

export const UI = {
  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Render alert message box safely
   */
  renderAlert(message, type = 'info', title = '') {
    const iconMap = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    const titleHTML = title ? `<strong>${this.escapeHTML(title)}</strong><br>` : '';
    return `
      <div class="alert alert-${this.escapeHTML(type)}" role="alert">
        <span class="alert-icon">${iconMap[type] || 'ℹ️'}</span>
        <div>
          ${titleHTML}
          <span>${this.escapeHTML(message)}</span>
        </div>
      </div>
    `;
  },

  /**
   * Render Technical Analysis / Recommendation Card
   */
  renderAnalysis(title, content) {
    return `
      <div class="analysis-card">
        <div class="analysis-title">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ${this.escapeHTML(title)}
        </div>
        <div class="analysis-content">
          ${this.escapeHTML(content)}
        </div>
      </div>
    `;
  },

  /**
   * Render Loading Button state
   */
  setLoading(btnElement, isLoading, text = 'Consultando...') {
    if (!btnElement) return;
    if (isLoading) {
      btnElement.dataset.originalText = btnElement.innerHTML;
      btnElement.disabled = true;
      btnElement.innerHTML = `<span class="spinner"></span> <span>${this.escapeHTML(text)}</span>`;
    } else {
      btnElement.disabled = false;
      if (btnElement.dataset.originalText) {
        btnElement.innerHTML = btnElement.dataset.originalText;
      }
    }
  },

  /**
   * Copy text to clipboard and show feedback
   */
  async copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      if (btnElement) {
        const origText = btnElement.innerHTML;
        btnElement.innerHTML = '✓ Copiado!';
        btnElement.classList.add('btn-primary');
        setTimeout(() => {
          btnElement.innerHTML = origText;
          btnElement.classList.remove('btn-primary');
        }, 2000);
      }
    } catch (err) {
      alert('Não foi possível copiar automaticamente.');
    }
  },

  /**
   * Format DNS RR Type string
   */
  formatRRType(typeNum) {
    const map = {
      1: 'A',
      2: 'NS',
      5: 'CNAME',
      6: 'SOA',
      12: 'PTR',
      15: 'MX',
      16: 'TXT',
      28: 'AAAA',
      33: 'SRV',
      43: 'DS',
      48: 'DNSKEY',
      257: 'CAA'
    };
    return map[typeNum] || `TYPE${typeNum}`;
  }
};
