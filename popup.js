document.addEventListener('DOMContentLoaded', function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryContainer = document.getElementById('summaryContainer');
  const configErrorContainer = document.getElementById('configErrorContainer');
  const configErrorMessage = document.getElementById('configErrorMessage');
  const summaryEl = document.getElementById('summary');
  const loader = document.getElementById('loader');

  // Summarize button click
  summarizeBtn.addEventListener('click', function() {
    summarizePage();
  });

  // Automatically trigger summarization if opened via keyboard shortcut
  chrome.runtime.sendMessage({action: "checkIfTriggeredByShortcut"}, function(response) {
    if (chrome.runtime.lastError) {
      console.log("Runtime error:", chrome.runtime.lastError);
      return;
    }
    if (response && response.triggeredByShortcut) {
      setTimeout(summarizePage, 100);
    }
  });


  function showConfigError(message) {
    configErrorMessage.textContent = message;
    configErrorContainer.classList.remove('hidden');
    console.error(message);
  }

  function summarizePage() {
    configErrorContainer.classList.add('hidden');

    // Get active tab content
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
        if (chrome.runtime.lastError) {
          showConfigError("Could not communicate with page. Please refresh the page and try again.");
          console.error("Runtime error:", chrome.runtime.lastError);
          return;
        }

        if (response && response.content) {
          console.log("Page content received");

          claudeService.getSummary(response.content, tabs[0].url, null, {
            onLoading: () => {
              loader.classList.remove('hidden');
              summaryEl.innerHTML = '';
            },
            onSuccess: (result) => {
              loader.classList.add('hidden');
              summaryEl.innerHTML = result;
            },
            onError: (error) => {
              loader.classList.add('hidden');
              showConfigError(`Error: ${error}`);
            }
          });
        } else {
          showConfigError("Could not retrieve page content. Please refresh the page and try again.");
          console.error("No response or content from tab");
        }
      });
    });
  }


});

