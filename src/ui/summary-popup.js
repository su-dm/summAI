(function() {
  class SummaryPopup {
    constructor() {
      this.popup = null;
      this.addStyles();
    }

    show(type = 'page', selectedText = null, position = null) {
      this.remove(); // Remove any existing popup

      const isPhrase = type === 'phrase';
      const title = isPhrase ? self.SUMM_AI.FEATURES.SUMMARIZE_PHRASE : self.SUMM_AI.FEATURES.SUMMARIZE_PAGE;
      const loadingText = isPhrase ? 'Getting explanation...' : 'Generating summary...';

      this.popup = this.createElement(title, loadingText);
      this.positionPopup(position, isPhrase);
      this.attachEventListeners(isPhrase);

      document.body.appendChild(this.popup);

      return {
        showLoading: () => this.showLoading(),
        showResult: (text) => this.showResult(text),
        showError: (error) => this.showError(error),
        remove: () => this.remove()
      };
    }

    createElement(title, loadingText) {
      const popup = document.createElement('div');
      popup.className = 'summary-popup';
      popup.innerHTML = `
        <div class="summary-header">
          <h3>${title}</h3>
          <button class="summary-close" aria-label="Close">&times;</button>
        </div>
        <div class="summary-content">
          <div class="summary-loading">
            <div class="summary-spinner"></div>
            <p>${loadingText}</p>
          </div>
          <div class="summary-result" style="display: none;"></div>
          <div class="summary-error" style="display: none;"></div>
        </div>
      `;
      return popup;
    }

    positionPopup(position, isPhrase) {
      this.popup.style.position = 'fixed';
      this.popup.style.zIndex = '10000';

      if (isPhrase && position) {
        // Position near selected text
        this.popup.style.left = Math.min(position.left, window.innerWidth - self.SUMM_AI.CONFIG.UI.POPUP_WIDTH) + 'px';
        this.popup.style.top = (position.bottom + 10) + 'px';
      } else {
        // Center on screen for page summaries
        this.popup.style.left = '50%';
        this.popup.style.top = '50%';
        this.popup.style.transform = 'translate(-50%, -50%)';

        // Add backdrop for page summaries
        this.popup.classList.add('summary-popup-centered');
      }
    }

    attachEventListeners(isPhrase) {
      // Close button
      this.popup.querySelector('.summary-close').addEventListener('click', this.remove);

      // ESC key to close
      document.addEventListener('keydown', this.handleEscKey);

      // Click outside to close (only for phrase popups)
      if (isPhrase) {
        // Use a short timeout to prevent the listener from firing on the same click that opened it
        setTimeout(() => {
          document.addEventListener('click', this.handleOutsideClick);
        }, 100);
      }
    }

    // Bound methods to be used as event listeners
    handleEscKey = (e) => {
      if (e.key === 'Escape') {
        this.remove();
      }
    };

    handleOutsideClick = (e) => {
      if (this.popup && !this.popup.contains(e.target)) {
        this.remove();
      }
    };

    showLoading() {
      this.popup.querySelector('.summary-loading').style.display = 'flex';
      this.popup.querySelector('.summary-result').style.display = 'none';
      this.popup.querySelector('.summary-error').style.display = 'none';
    }

    showResult(text) {
      this.popup.querySelector('.summary-loading').style.display = 'none';
      this.popup.querySelector('.summary-result').style.display = 'block';
      this.popup.querySelector('.summary-result').textContent = text;
      this.popup.querySelector('.summary-error').style.display = 'none';
    }

    showError(error) {
      this.popup.querySelector('.summary-loading').style.display = 'none';
      this.popup.querySelector('.summary-result').style.display = 'none';
      this.popup.querySelector('.summary-error').style.display = 'block';
      this.popup.querySelector('.summary-error').textContent = `Error: ${error}`;
    }

    remove = () => {
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
      }
      // Always remove all potentially attached listeners
      document.removeEventListener('keydown', this.handleEscKey);
      document.removeEventListener('click', this.handleOutsideClick);
    }

    addStyles() {
      if (document.getElementById('summary-popup-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'summary-popup-styles';
      styles.textContent = `
        .summary-popup {
          width: ${self.SUMM_AI.CONFIG.UI.POPUP_WIDTH}px;
          max-height: ${self.SUMM_AI.CONFIG.UI.POPUP_MAX_HEIGHT}px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          overflow: hidden;
        }

        .summary-popup-centered {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .summary-popup-centered::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: -1;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
        }

        .summary-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .summary-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .summary-close:hover {
          background: #e9ecef;
          color: #333;
        }

        .summary-content {
          padding: 16px;
          max-height: 320px;
          overflow-y: auto;
        }

        .summary-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
        }

        .summary-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #4285f4;
          border-radius: 50%;
          animation: summary-spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes summary-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .summary-loading p {
          margin: 0;
          color: #666;
        }

        .summary-result {
          color: #333;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .summary-error {
          color: #d32f2f;
          background: #ffebee;
          padding: 12px;
          border-radius: 4px;
        }
      `;

      document.head.appendChild(styles);
    }
  }

  self.SUMM_AI.SummaryPopup = SummaryPopup;
})();