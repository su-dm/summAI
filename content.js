chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const pageContent = extractMainContent();
    sendResponse({content: pageContent});
  }
  return true;
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

