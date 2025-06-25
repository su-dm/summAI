(function() {
  class SummarizerService {

    /**
     * Generic summarization handler that works for both phrase and page summarization
     */
    static async summarize(type, options = {}) {
      const { selectedText, url, onLoading, onSuccess, onError } = options;

      try {
        if (onLoading) onLoading();

        let content;

        if (type === 'phrase') {
          // For phrase summarization, get limited context
          content = self.SUMM_AI.ContentExtractor.getContextForSelection();
        } else {
          // For page summarization, get full content
          content = self.SUMM_AI.ContentExtractor.extractMainContent();
        }

        if (!content || content.length < 10) {
          throw new Error('Could not extract meaningful content from the page.');
        }

        const summary = await self.SUMM_AI.apiService.getSummary(
          content,
          url || window.location.href,
          selectedText
        );

        if (onSuccess) onSuccess(summary);
        return summary;

      } catch (error) {
        console.error(`${type} summarization error:`, error);
        if (onError) onError(error.message);
        throw error;
      }
    }

    /**
     * Summarize selected phrase with context
     */
    static async summarizePhrase(selectedText, options = {}) {
      return this.summarize('phrase', {
        selectedText,
        ...options
      });
    }

    /**
     * Summarize entire page
     */
    static async summarizePage(options = {}) {
      return this.summarize('page', options);
    }

    /**
     * Get content for message passing (used by popup)
     */
    static getPageContentForMessage() {
      try {
        const content = self.SUMM_AI.ContentExtractor.extractMainContent();
        return { content };
      } catch (error) {
        console.error('Error extracting page content:', error);
        return { error: error.message };
      }
    }
  }

  self.SUMM_AI.SummarizerService = SummarizerService;
})();