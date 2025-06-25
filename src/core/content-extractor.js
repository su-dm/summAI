(function() {
  class ContentExtractor {
    static extractMainContent() {
      let content = this.extractBySelectors() || this.extractFromBody();
      return this.cleanAndLimitContent(content);
    }

    static extractBySelectors() {
      for (const selector of self.SUMM_AI.SELECTORS.CONTENT_CONTAINERS) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Find the element with the most content
          const bestElement = Array.from(elements).reduce((best, current) =>
            current.textContent.length > best.textContent.length ? current : best
          );

          const content = bestElement.textContent;
          if (content.length > 100) {
            return content;
          }
        }
      }
      return null;
    }

    static extractFromBody() {
      const clone = document.body.cloneNode(true);

      // Remove unwanted elements
      clone.querySelectorAll(self.SUMM_AI.SELECTORS.ELEMENTS_TO_REMOVE)
        .forEach(el => el.remove());

      // Extract content from relevant elements
      const contentElements = clone.querySelectorAll(self.SUMM_AI.SELECTORS.CONTENT_ELEMENTS);
      const content = Array.from(contentElements)
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0)
        .join('\n\n');

      return content || document.body.textContent;
    }

    static cleanAndLimitContent(content) {
      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();

      // Limit content length
      if (content.length > self.SUMM_AI.CONFIG.CONTENT_LIMITS.PAGE_MAX_LENGTH) {
        content = content.substring(0, self.SUMM_AI.CONFIG.CONTENT_LIMITS.PAGE_MAX_LENGTH) + '...';
      }

      return content;
    }

    static getContextForSelection(maxLength = self.SUMM_AI.CONFIG.CONTENT_LIMITS.CONTEXT_LENGTH) {
      const fullContent = this.extractMainContent();

      if (fullContent.length <= maxLength) {
        return fullContent;
      }

      return fullContent.substring(0, maxLength) + '...';
    }
  }

  self.SUMM_AI.ContentExtractor = ContentExtractor;
})();