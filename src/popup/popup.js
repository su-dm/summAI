import { ACTIONS, FEATURES } from '../core/constants.js';
import { SummarizerService } from '../core/summarizer.js';

class PopupHandler {
  constructor() {
    this.elements = {
      summarizeBtn: document.getElementById('summarizeBtn'),
      loader: document.getElementById('loader'),
      summary: document.getElementById('summary'),
      errorContainer: document.getElementById('errorContainer'),
      errorMessage: document.getElementById('errorMessage')
    };

    this.setupEventListeners();
    this.checkAutoTrigger();
  }

  setupEventListeners() {
    this.elements.summarizeBtn.addEventListener('click', () => {
      this.summarizePage();
    });
  }

  async checkAutoTrigger() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: ACTIONS.CHECK_SHORTCUT_TRIGGER
      });

      if (response?.triggeredByShortcut) {
        setTimeout(() => this.summarizePage(), 100);
      }
    } catch (error) {
      console.error('Error checking shortcut trigger:', error);
    }
  }

  async summarizePage() {
    this.hideError();

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Get page content
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: ACTIONS.GET_PAGE_CONTENT
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      if (!response?.content) {
        throw new Error('Could not retrieve page content. Please refresh the page and try again.');
      }

      // Use consolidated summarizer service
      await SummarizerService.summarizePage({
        url: tab.url,
        onLoading: () => this.showLoading(),
        onSuccess: (summary) => this.showResult(summary),
        onError: (error) => this.showError(error)
      });

    } catch (error) {
      this.showError(error.message);
      this.hideLoading();
    }
  }

  showLoading() {
    this.elements.loader.classList.remove('hidden');
    this.elements.summary.innerHTML = '';
  }

  hideLoading() {
    this.elements.loader.classList.add('hidden');
  }

  showResult(summary) {
    this.hideLoading();
    this.elements.summary.textContent = summary;
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorContainer.classList.remove('hidden');
  }

  hideError() {
    this.elements.errorContainer.classList.add('hidden');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new PopupHandler());