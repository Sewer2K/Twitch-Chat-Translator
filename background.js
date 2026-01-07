// Background service worker for Twitch Chat Translator
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    targetLanguage: 'en',
    enabled: true
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reloadSettings') {
    // Settings will be reloaded via storage.onChanged listener in content script
    sendResponse({ success: true });
  }
  return true;
});

