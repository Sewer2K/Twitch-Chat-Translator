// Popup script for Twitch Chat Translator
document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const languageSelect = document.getElementById('language-select');
  const saveButton = document.getElementById('save-btn');

  // Load saved settings
  chrome.storage.sync.get(['targetLanguage', 'enabled'], (result) => {
    if (result.targetLanguage) {
      languageSelect.value = result.targetLanguage;
    }
    if (result.enabled !== undefined) {
      enabledToggle.checked = result.enabled;
    } else {
      enabledToggle.checked = true;
    }
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const settings = {
      targetLanguage: languageSelect.value,
      enabled: enabledToggle.checked
    };

    chrome.storage.sync.set(settings, () => {
      // Show success message
      saveButton.textContent = '✓ Saved!';
      saveButton.style.backgroundColor = '#4CAF50';
      
      setTimeout(() => {
        saveButton.textContent = 'Save Settings';
        saveButton.style.backgroundColor = '';
      }, 2000);

      // Notify content script to reload settings
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('twitch.tv')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' });
        }
      });
    });
  });

  // Auto-save on change
  enabledToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: enabledToggle.checked }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('twitch.tv')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' });
        }
      });
    });
  });

  languageSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ targetLanguage: languageSelect.value }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('twitch.tv')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadSettings' });
        }
      });
    });
  });
});

