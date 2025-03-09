document.addEventListener('DOMContentLoaded', function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryContainer = document.getElementById('summaryContainer');
  const configErrorContainer = document.getElementById('configErrorContainer');
  const configErrorMessage = document.getElementById('configErrorMessage');
  const summaryEl = document.getElementById('summary');
  const loader = document.getElementById('loader');
  let apiKey = null;

  // Load API key from the config
  loadApiKey();

  // Summarize button click
  summarizeBtn.addEventListener('click', function() {
    summarizePage();
  });

  // Automatically trigger summarization if opened via keyboard shortcut
  chrome.runtime.sendMessage({action: "checkIfTriggeredByShortcut"}, function(response) {
    if (response && response.triggeredByShortcut) {
      setTimeout(summarizePage, 100);
    }
  });

  function loadApiKey() {
    if (!extensionConfig || !extensionConfig.apiKey || extensionConfig.apiKey === 'YOUR_CLAUDE_API_KEY') {
      showConfigError("API key not configured. Please set your actual API key in config.js");
      return;
    }

    apiKey = extensionConfig.apiKey;
    console.log("API key loaded from config");
  }

  function showConfigError(message) {
    configErrorMessage.textContent = message;
    configErrorContainer.classList.remove('hidden');
    console.error(message);
  }

  function summarizePage() {
    loader.classList.remove('hidden');
    summaryEl.innerHTML = '';
    configErrorContainer.classList.add('hidden');

    // Check if we have the API key
    if (!apiKey) {
      // Try loading it again - maybe config has been updated
      loadApiKey();

      if (!apiKey) {
        showConfigError("API key not available. Please check your configuration in config.js");
        loader.classList.add('hidden');
        return;
      }
    }

    // Get active tab content
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
        if (response && response.content) {
          console.log("Page content received");
          getClaudeSummary(response.content, apiKey, tabs[0].url);
        } else {
          summaryEl.innerHTML = "Could not retrieve page content";
          loader.classList.add('hidden');
          console.error("Error retrieving page content:", chrome.runtime.lastError);
        }
      });
    });
  }

  function getClaudeSummary(content, apiKey, url) {
    const prompt = `Please provide a concise bullet-point summary of the main points from this webpage content. Focus only on the most important information. URL: ${url}\n\nContent: ${content}`;

    const model = extensionConfig.apiModel || "claude-3-sonnet-20240229";
    const maxTokens = extensionConfig.apiMaxTokens || 1000;

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-dangerous-direct-browser-access': 'true',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })
    .then(response => response.json())
    .then(data => {
      loader.classList.add('hidden');
      if (data.content && data.content[0] && data.content[0].text) {
        summaryEl.innerHTML = data.content[0].text;
      } else {
        showConfigError("Error generating summary. Please check your API key and try again.");
        console.error("API response:", data);
      }
    })
    .catch(error => {
      loader.classList.add('hidden');
      showConfigError(`API Error: ${error.message}`);
      console.error("API error:", error);
    });
  }
});

