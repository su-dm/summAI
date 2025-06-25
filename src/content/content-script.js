(function() {
  class ContentScriptHandler {
    constructor() {
      this.summaryPopup = new self.SUMM_AI.SummaryPopup();
      this.setupMessageListener();
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
          case self.SUMM_AI.ACTIONS.GET_PAGE_CONTENT:
            this.handleGetPageContent(sendResponse);
            return true; // Indicate async response
          case self.SUMM_AI.ACTIONS.SUMMARIZE_PHRASE:
            this.handleSummarizePhrase(request);
            sendResponse({});
            break;
          case self.SUMM_AI.ACTIONS.SUMMARIZE_PAGE:
            this.handleSummarizePage();
            sendResponse({});
            break;
          default:
            sendResponse({});
        }
        return false; // Synchronous response
      });
    }

    async handleGetPageContent(sendResponse) {
      const result = await self.SUMM_AI.SummarizerService.getPageContentForMessage();
      sendResponse(result);
    }

    async handleSummarizePhrase(request) {
      const { selectedText } = request;

      // Get selection position for popup placement
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const position = range ? range.getBoundingClientRect() : null;

      // Show popup for phrase summarization
      const popupControls = this.summaryPopup.show('phrase', selectedText, position);

      // Use consolidated summarizer
      await self.SUMM_AI.SummarizerService.summarizePhrase(selectedText, {
        url: window.location.href,
        onLoading: () => popupControls.showLoading(),
        onSuccess: (summary) => popupControls.showResult(summary),
        onError: (error) => popupControls.showError(error)
      });
    }

    async handleSummarizePage() {
      // Show centered popup for page summarization
      const popupControls = this.summaryPopup.show('page');

      // Use consolidated summarizer
      await self.SUMM_AI.SummarizerService.summarizePage({
        url: window.location.href,
        onLoading: () => popupControls.showLoading(),
        onSuccess: (summary) => popupControls.showResult(summary),
        onError: (error) => popupControls.showError(error)
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ContentScriptHandler());
  } else {
    new ContentScriptHandler();
  }
})();