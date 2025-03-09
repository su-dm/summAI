document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryContainer = document.getElementById('summaryContainer');
  const apiKeyContainer = document.getElementById('apiKeyContainer');
  const summaryEl = document.getElementById('summary');
  const loader = document.getElementById('loader');
  
  // Check if API key is already saved
  chrome.storage.local.get(['claudeApiKey'], function(result) {
    if (result.claudeApiKey) {
      apiKeyInput.value = result.claudeApiKey;
      apiKeyContainer.classList.add('hidden');
      summaryContainer.classList.remove('hidden');
    }
  });
  
  // Save API key
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({claudeApiKey: apiKey}, function() {
        apiKeyContainer.classList.add('hidden');
        summaryContainer.classList.remove('hidden');
      });
    }
  });
  
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
  
  function summarizePage() {
    loader.classList.remove('hidden');
    summaryEl.innerHTML = '';
    
    // Get API key
    chrome.storage.local.get(['claudeApiKey'], function(result) {
      if (!result.claudeApiKey) {
        summaryEl.innerHTML = "Please save your Claude API key first";
        loader.classList.add('hidden');
        return;
      }
      
      // Get active tab content
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
          if (response && response.content) {
            getClaudeSummary(response.content, result.claudeApiKey, tabs[0].url);
          } else {
            summaryEl.innerHTML = "Could not retrieve page content";
            loader.classList.add('hidden');
          }
        });
      });
    });
  }
  
  function getClaudeSummary(content, apiKey, url) {
    const prompt = `Please provide a concise bullet-point summary of the main points from this webpage content. Focus only on the most important information. URL: ${url}\n\nContent: ${content}`;
    
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
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
        summaryEl.innerHTML = "Error generating summary. Please check your API key and try again.";
        console.error("API response:", data);
      }
    })
    .catch(error => {
      loader.classList.add('hidden');
      summaryEl.innerHTML = `Error: ${error.message}`;
      console.error("API error:", error);
    });
  }
});

