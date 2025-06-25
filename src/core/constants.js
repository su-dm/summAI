// Global constants for Chrome extension
self.SUMM_AI = self.SUMM_AI || {};

self.SUMM_AI.ACTIONS = {
  GET_PAGE_CONTENT: 'getPageContent',
  SUMMARIZE_PHRASE: 'summarizePhrase',
  SUMMARIZE_PAGE: 'summarizePage',
  CHECK_SHORTCUT_TRIGGER: 'checkShortcutTrigger'
};

self.SUMM_AI.FEATURES = {
  SUMMARIZE_PAGE: 'Summarize Page',
  SUMMARIZE_PHRASE: 'Summarize Phrase'
};

self.SUMM_AI.CONFIG = {
  API_MODEL: 'claude-3-sonnet-20240229',
  MAX_TOKENS: {
    SUMMARY: 1000,
    EXPLANATION: 300
  },
  CONTENT_LIMITS: {
    PAGE_MAX_LENGTH: 10000,
    CONTEXT_LENGTH: 2000
  },
  UI: {
    POPUP_WIDTH: 320,
    POPUP_MAX_HEIGHT: 400
  }
};

self.SUMM_AI.SELECTORS = {
  CONTENT_CONTAINERS: [
    'article', 'main', '.content', '.main-content', '.article-content',
    '#content', '#main', '#main-content', '.post-content', '.entry-content'
  ],
  CONTENT_ELEMENTS: 'p, h1, h2, h3, h4, h5, h6, li',
  ELEMENTS_TO_REMOVE: 'script, style, noscript, iframe, nav, header, footer, aside'
};