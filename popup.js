document.addEventListener('DOMContentLoaded', function() {
  const apiKeyFileInput = document.getElementById('apiKeyFile');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryContainer = document.getElementById('summaryContainer');
  const apiKeyContainer = document.getElementById('apiKeyContainer');
  const summaryEl = document.getElementById('summary');
  const loader = document.getElementById('loader');
  let apiKey = null;
  
  // Check if API key file has been uploaded previously
  chrome.storage.local.get(['hasApiKeyFile'], function(result) {
    if (result.hasApiKeyFile) {
      apiKeyContainer.classList.add('hidden');
      summaryContainer.classList.remove('hidden');
    }
  });
  
  // Save API key from file
  apiKeyFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        apiKey = e.target.result.trim();
        console.log("API key loaded");
        document.getElementById('fileStatus').textContent = 'File loaded';
      } catch (error) {
        document.getElementById('fileStatus').textContent = 'Invalid file format';
        console.error('Error reading file:', error);
      }
    };
    reader.readAsText(file);
  });
  
  // Save API key file status
  saveApiKeyBtn.addEventListener('click', function() {
    if (apiKey) {
      chrome.storage.local.set({hasApiKeyFile: true}, function() {
        console.log("API key file status saved");
        apiKeyContainer.classList.add('hidden');
        summaryContainer.classList.remove('hidden');
      });
      // Store the actual key in memory only, not in storage
    } else {
      document.getElementById('fileStatus').textContent = 'Please select a valid API key file first';
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
    
    // Check if we have the API key in memory
    if (!apiKey) {
      summaryEl.innerHTML = "Please upload your Claude API key file first";
      loader.classList.add('hidden');
      apiKeyContainer.classList.remove('hidden');
      summaryContainer.classList.add('hidden');
      return;
    }
    
    // Get active tab content
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
        if (response && response.content) {
          console.log("Page content received:", response.content);
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
    
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-dangerous-direct-browser-access': 'true',
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

