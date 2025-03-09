chrome.commands.onCommand.addListener((command) => {
  console.log("Command received:", command);
  if (command === "_execute_action") {
    chrome.action.openPopup();
    // Set a flag to indicate the popup was opened via shortcut
    chrome.storage.local.set({triggeredByShortcut: true});
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
});
