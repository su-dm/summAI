chrome.commands.onCommand.addListener((command) => {
  console.log("Command received:", command);
  if (command === "_execute_action") {
    chrome.action.openPopup();
    // Set a flag to indicate the popup was opened via shortcut
    chrome.storage.local.set({triggeredByShortcut: true});
  }
});

// Create context menu when extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "aiSummary",
    title: "AI Summary",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "aiSummary" && info.selectionText) {
    // Send message to content script to show AI summary
    chrome.tabs.sendMessage(tab.id, {
      action: "showAISummary",
      selectedText: info.selectionText,
      pageUrl: tab.url
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "checkIfTriggeredByShortcut") {
    chrome.storage.local.get(['triggeredByShortcut'], function(result) {
      console.log("Triggered by shortcut:", result.triggeredByShortcut);
      sendResponse({triggeredByShortcut: result.triggeredByShortcut || false});
      // Clear the flag
      chrome.storage.local.remove('triggeredByShortcut');
    });
    return true; // Required for async sendResponse
  }

  // Always send a response for unhandled cases to prevent channel close error
  sendResponse({});
  return false;
});
