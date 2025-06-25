importScripts('../core/constants.js');

const { ACTIONS, FEATURES } = self.SUMM_AI;

class BackgroundHandler {
  constructor() {
    this.setupCommandListener();
    this.setupContextMenu();
    this.setupMessageListener();
  }

  setupCommandListener() {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "summarize-page") {
        // Get active tab and trigger page summarization directly
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: ACTIONS.SUMMARIZE_PAGE
          });
        } else {
          console.error('Could not find an active tab to send the message to.');
        }
      }
    });
  }

  setupContextMenu() {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.contextMenus.create({
        id: "summarizePhrase",
        title: FEATURES.SUMMARIZE_PHRASE,
        contexts: ["selection"]
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "summarizePhrase" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
          action: ACTIONS.SUMMARIZE_PHRASE,
          selectedText: info.selectionText
        });
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === ACTIONS.CHECK_SHORTCUT_TRIGGER) {
        chrome.storage.local.get(['triggeredByShortcut'], (result) => {
          const wasTriggered = result.triggeredByShortcut || false;
          sendResponse({ triggeredByShortcut: wasTriggered });

          // Clear the flag
          if (wasTriggered) {
            chrome.storage.local.remove('triggeredByShortcut');
          }
        });
        return true; // Async response
      }

      sendResponse({});
      return false;
    });
  }
}

new BackgroundHandler();