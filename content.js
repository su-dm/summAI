chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "getPageContent") {
    const pageContent = extractMainContent();
    console.log("Extracted page content:", pageContent);
    sendResponse({content: pageContent});
    return false; // Synchronous response
  } else if (request.action === "showAISummary") {
    showAISummaryPopup(request.selectedText, request.pageUrl);
    sendResponse({}); // Send empty response to prevent channel close
    return false; // Synchronous response
  }

  // Send response for unhandled actions
  sendResponse({});
  return false;
});

// Function to extract the main content from the page
function extractMainContent() {
  // Try to find the main content by common elements
  let content = '';

  // Potential content containers
  const possibleSelectors = [
    'article', 'main', '.content', '.main-content', '.article-content',
    '#content', '#main', '#main-content', '.post-content', '.entry-content'
  ];

  for (const selector of possibleSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Use the largest container by content length
      let bestElement = elements[0];
      let maxLength = bestElement.textContent.length;

      for (let i = 1; i < elements.length; i++) {
        const length = elements[i].textContent.length;
        if (length > maxLength) {
          maxLength = length;
          bestElement = elements[i];
        }
      }

      content = bestElement.textContent;
      break;
    }
  }

  // Fallback: if no content found with selectors, use the whole body
  if (!content || content.length < 100) {
    // Remove scripts, styles, and hidden elements
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, nav, header, footer, aside');
    elementsToRemove.forEach(el => el.remove());

    // Get paragraphs and headings as they likely contain the main content
    const contentElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
    content = Array.from(contentElements).map(el => el.textContent.trim()).join('\n\n');

    // If still no good content, just take everything
    if (!content || content.length < 100) {
      content = document.body.textContent;
    }
  }

  // Clean up the content
  content = content.replace(/\s+/g, ' ').trim();

  // Limit content length to avoid exceeding API limits
  const maxLength = 10000;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }

  return content;
}

// Function to create and show AI Summary popup
function showAISummaryPopup(selectedText, pageUrl) {
  // Remove any existing popup
  const existingPopup = document.getElementById('ai-summary-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'ai-summary-popup';
  popup.innerHTML = `
    <div class="ai-summary-header">
      <h3>AI Summary</h3>
      <button class="ai-summary-close" title="Close">&times;</button>
    </div>
    <div class="ai-summary-content">
      <div class="ai-summary-loading">
        <div class="ai-summary-spinner"></div>
        <p>Getting AI summary...</p>
      </div>
      <div class="ai-summary-result" style="display: none;"></div>
      <div class="ai-summary-error" style="display: none;"></div>
    </div>
  `;

  // Add styles
  addAISummaryStyles();

  // Position popup near the selection
  const selection = window.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const rect = range ? range.getBoundingClientRect() : null;

  if (rect) {
    popup.style.position = 'fixed';
    popup.style.left = Math.min(rect.left, window.innerWidth - 350) + 'px';
    popup.style.top = (rect.bottom + 10) + 'px';
    popup.style.zIndex = '10000';
  } else {
    // Fallback position
    popup.style.position = 'fixed';
    popup.style.top = '20px';
    popup.style.right = '20px';
    popup.style.zIndex = '10000';
  }

  document.body.appendChild(popup);

  // Add close functionality
  const closeBtn = popup.querySelector('.ai-summary-close');
  closeBtn.addEventListener('click', () => {
    popup.remove();
  });

  // Close popup when clicking outside
  document.addEventListener('click', function handleOutsideClick(e) {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  });

  // Get AI summary
  getAISummaryForSelection(selectedText, pageUrl, popup);
}

// Function to add styles for the AI Summary popup
function addAISummaryStyles() {
  // Check if styles already exist
  if (document.getElementById('ai-summary-styles')) {
    return;
  }

  const styles = document.createElement('style');
  styles.id = 'ai-summary-styles';
  styles.textContent = `
    #ai-summary-popup {
      width: 320px;
      max-height: 400px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      overflow: hidden;
    }

    .ai-summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }

    .ai-summary-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .ai-summary-close {
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

    .ai-summary-close:hover {
      background: #e9ecef;
      color: #333;
    }

    .ai-summary-content {
      padding: 16px;
      max-height: 320px;
      overflow-y: auto;
    }

    .ai-summary-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
    }

    .ai-summary-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #4285f4;
      border-radius: 50%;
      animation: ai-summary-spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes ai-summary-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .ai-summary-loading p {
      margin: 0;
      color: #666;
    }

    .ai-summary-result {
      color: #333;
      white-space: pre-wrap;
    }

    .ai-summary-error {
      color: #d32f2f;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
    }
  `;

  document.head.appendChild(styles);
}

// Function to get AI summary for selected text
function getAISummaryForSelection(selectedText, pageUrl, popupElement) {
  // Check if claudeService is available
  if (typeof claudeService === 'undefined') {
    const loadingDiv = popupElement.querySelector('.ai-summary-loading');
    const errorDiv = popupElement.querySelector('.ai-summary-error');

    loadingDiv.style.display = 'none';
    errorDiv.textContent = 'Error: claudeService not available. Please reload the page.';
    errorDiv.style.display = 'block';
    return;
  }

  // Get page context
  const pageContent = extractMainContent();
  const contextLength = 2000; // Limit context to avoid token limits
  const trimmedContext = pageContent.length > contextLength
    ? pageContent.substring(0, contextLength) + '...'
    : pageContent;

  // Use shared Claude service
  claudeService.getSummary(trimmedContext, pageUrl, selectedText, {
    onLoading: () => {
      // Loading state is already shown by default
    },
    onSuccess: (result) => {
      const loadingDiv = popupElement.querySelector('.ai-summary-loading');
      const resultDiv = popupElement.querySelector('.ai-summary-result');

      loadingDiv.style.display = 'none';
      resultDiv.textContent = result;
      resultDiv.style.display = 'block';
    },
    onError: (error) => {
      const loadingDiv = popupElement.querySelector('.ai-summary-loading');
      const errorDiv = popupElement.querySelector('.ai-summary-error');

      loadingDiv.style.display = 'none';
      errorDiv.textContent = `Error: ${error}`;
      errorDiv.style.display = 'block';
    }
  });
}

