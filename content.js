// Twitch Chat Translator Content Script
(function() {
  'use strict';

  let targetLanguage = 'en';
  let enabled = true;
  let translatedMessages = new Map();
  let observer = null;

  // Load settings from storage
  chrome.storage.sync.get(['targetLanguage', 'enabled'], (result) => {
    targetLanguage = result.targetLanguage || 'en';
    enabled = result.enabled !== false;
    if (enabled) {
      startObserving();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      if (changes.targetLanguage) {
        targetLanguage = changes.targetLanguage.newValue || 'en';
        translatedMessages.clear();
        translateAllMessages();
      }
      if (changes.enabled !== undefined) {
        enabled = changes.enabled.newValue !== false;
        if (enabled) {
          startObserving();
        } else {
          stopObserving();
        }
      }
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reloadSettings') {
      chrome.storage.sync.get(['targetLanguage', 'enabled'], (result) => {
        targetLanguage = result.targetLanguage || 'en';
        enabled = result.enabled !== false;
        translatedMessages.clear();
        if (enabled) {
          startObserving();
          translateAllMessages();
        } else {
          stopObserving();
        }
        sendResponse({ success: true });
      });
      return true; // Keep message channel open for async response
    }
  });

  function startObserving() {
    if (observer) {
      console.log('[Twitch Translator] Observer already active');
      return;
    }

    console.log('[Twitch Translator] Starting observation...');

    // Multiple initial scans with delays (Twitch loads chat dynamically)
    setTimeout(() => scanAndTranslate(), 1000);
    setTimeout(() => scanAndTranslate(), 3000);
    setTimeout(() => scanAndTranslate(), 5000);

    // Observe chat container for new messages
    const chatContainer = findChatContainer();
    if (chatContainer) {
      console.log('[Twitch Translator] Setting up MutationObserver');
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Check if this node or its children are messages
              handleNewMessage(node);
              // Also check children in case the added node is a container
              if (node.querySelectorAll) {
                const childMessages = node.querySelectorAll('[data-a-target*="message"], .chat-line, [class*="chat-line"]');
                childMessages.forEach(child => handleNewMessage(child));
              }
            }
          });
        });
      });

      observer.observe(chatContainer, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    } else {
      console.warn('[Twitch Translator] Chat container not found, retrying in 2 seconds...');
      setTimeout(() => {
        if (!observer) startObserving();
      }, 2000);
    }
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function findChatContainer() {
    // Try different selectors for Twitch chat (updated for current Twitch structure)
    const selectors = [
      '[data-a-target="chat-scrollable-area"]',
      '[data-a-target="chat-messages"]',
      '.chat-scrollable-area__message-container',
      '[data-test-selector="chat-scrollable-area"]',
      '.chat-list',
      '[aria-label*="Chat"]',
      '[aria-label*="chat"]',
      'section[data-a-target="chat-container"]',
      'div[data-a-target="chat-container"]',
      '[class*="chat-list"]',
      '[class*="chat-messages"]',
      '[class*="chatContainer"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[Twitch Translator] Found chat container:', selector);
        return element;
      }
    }

    // More aggressive fallback: look for elements with chat-related attributes
    const allElements = document.querySelectorAll('[data-a-target*="chat"], [class*="chat"], [id*="chat"]');
    for (const el of allElements) {
      const text = el.textContent || '';
      // Look for elements that contain multiple messages (likely the container)
      if (text.length > 100 && (el.querySelectorAll('[data-a-target*="message"]').length > 0 || 
          el.querySelectorAll('.chat-line').length > 0)) {
        console.log('[Twitch Translator] Found chat container via fallback');
        return el;
      }
    }

    console.warn('[Twitch Translator] Chat container not found');
    return null;
  }

  function findChatMessages() {
    // Try different selectors for chat messages (updated for current Twitch)
    const selectors = [
      '[data-a-target="chat-line-message"]',
      '[data-a-target="chat-message"]',
      '[data-a-target="chat-line-message-body"]',
      '.chat-line__message',
      '.chat-line',
      '[data-test-selector="chat-line-message"]',
      '[class*="chat-line"]',
      '[class*="chatLine"]',
      '[class*="message"]'
    ];

    const messages = [];
    const foundSelectors = new Set();
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        foundSelectors.add(selector);
        elements.forEach(el => {
          if (!el.dataset.translated && !el.dataset.translating) {
            messages.push(el);
          }
        });
      }
    }

    if (foundSelectors.size > 0) {
      console.log('[Twitch Translator] Found messages using:', Array.from(foundSelectors));
    }

    // More aggressive fallback: find messages by structure within chat container
    if (messages.length === 0) {
      const chatContainer = findChatContainer();
      if (chatContainer) {
        // Look for any divs that look like messages
        const allDivs = chatContainer.querySelectorAll('div[data-a-target*="message"], div[class*="message"], div[class*="chat-line"]');
        allDivs.forEach(msg => {
          const text = msg.textContent?.trim() || '';
          // Filter out containers and keep only actual message elements
          if (text.length >= 2 && text.length < 500 && 
              !msg.dataset.translated && !msg.dataset.translating &&
              !msg.querySelector('[data-a-target*="message"]')) {
            messages.push(msg);
          }
        });
        console.log('[Twitch Translator] Found', messages.length, 'messages via fallback');
      }
    }

    return messages;
  }

  function getMessageText(element) {
    // Try to find the actual message text within the element
    const textSelectors = [
      '.text-fragment',
      '[data-a-target="chat-message-text"]',
      '[data-a-target="chat-line-message-body"]',
      '.chat-line__message-text',
      'span[data-a-target="chat-message-text"]',
      '[class*="message-text"]',
      '[class*="text-fragment"]'
    ];

    for (const selector of textSelectors) {
      const textEl = element.querySelector(selector);
      if (textEl && textEl.textContent.trim()) {
        const text = textEl.textContent.trim();
        if (text.length >= 2) return text;
      }
    }

    // Fallback: get all text, but exclude username, timestamp, badges, etc.
    const clone = element.cloneNode(true);
    
    // Remove username elements
    const usernameSelectors = [
      '[data-a-target="chat-message-username"]',
      '[data-a-target="chat-author"]',
      '.chat-author__display-name',
      '[class*="username"]',
      '[class*="author"]'
    ];
    usernameSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    
    // Remove timestamp elements
    const timestampSelectors = [
      '[data-a-target="chat-message-timestamp"]',
      '.chat-line__timestamp',
      '[class*="timestamp"]',
      '[class*="time"]'
    ];
    timestampSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Remove badges and icons
    clone.querySelectorAll('[class*="badge"], [class*="emote"], img, svg').forEach(el => el.remove());

    const text = clone.textContent.trim();
    return text.length >= 2 ? text : null;
  }

  function handleNewMessage(element) {
    if (!enabled) return;
    if (!element || typeof element.querySelector !== 'function') return;
    
    // Check if already translated or translating
    if (element.dataset.translated === 'true' || element.dataset.translating === 'true') return;

    // Check if it's a chat message element
    if (!isChatMessage(element)) return;
    
    const messageText = getMessageText(element);
    if (!messageText || messageText.length < 2) return;

    // Skip system messages and commands
    if (messageText.startsWith('!') || messageText.startsWith('/')) return;

    translateMessage(element, messageText);
  }

  function isChatMessage(element) {
    if (!element || typeof element.querySelector !== 'function') return false;
    
    // Check if element looks like a chat message
    const text = element.textContent || '';
    if (text.length < 2 || text.length > 500) return false;

    // Check for common chat message patterns
    const chatIndicators = [
      element.querySelector('[data-a-target*="message"]'),
      element.querySelector('[data-a-target*="chat"]'),
      element.querySelector('.chat-line'),
      element.closest('[data-a-target*="chat"]'),
      element.getAttribute('data-a-target')?.includes('message'),
      element.getAttribute('data-a-target')?.includes('chat'),
      element.className?.includes('chat-line'),
      element.className?.includes('message')
    ];

    const isMessage = chatIndicators.some(indicator => indicator !== null);
    
    // Additional check: make sure it's not a container with many messages
    if (isMessage && element.querySelectorAll('[data-a-target*="message"]').length > 1) {
      return false; // This is a container, not a single message
    }

    return isMessage;
  }

  function scanAndTranslate() {
    if (!enabled) {
      console.log('[Twitch Translator] Translation disabled');
      return;
    }

    const messages = findChatMessages();
    console.log('[Twitch Translator] Scanning', messages.length, 'messages');
    
    messages.forEach(message => {
      const text = getMessageText(message);
      if (text && text.length >= 2 && !text.startsWith('!') && !text.startsWith('/')) {
        translateMessage(message, text);
      }
    });
  }

  function translateMessage(element, originalText) {
    if (!originalText || originalText.length < 2) return;
    if (element.dataset.translated === 'true') return;

    // Mark as processing
    element.dataset.translating = 'true';

    // Check cache first
    const cacheKey = `${originalText}_${targetLanguage}`;
    if (translatedMessages.has(cacheKey)) {
      applyTranslation(element, originalText, translatedMessages.get(cacheKey));
      return;
    }

    // Translate using Google Translate API
    translateText(originalText, targetLanguage)
      .then(translatedText => {
        if (translatedText && translatedText !== originalText) {
          translatedMessages.set(cacheKey, translatedText);
          applyTranslation(element, originalText, translatedText);
        }
      })
      .catch(error => {
        console.error('Translation error:', error);
        element.dataset.translating = 'false';
      });
  }

  function applyTranslation(element, originalText, translatedText) {
    if (!translatedText || translatedText === originalText) {
      element.dataset.translating = 'false';
      return;
    }

    // Find the text element to modify
    const textSelectors = [
      '.text-fragment',
      '[data-a-target="chat-message-text"]',
      '[data-a-target="chat-line-message-body"]',
      '.chat-line__message-text',
      'span[data-a-target="chat-message-text"]',
      '[class*="message-text"]',
      '[class*="text-fragment"]'
    ];

    let textElement = null;
    for (const selector of textSelectors) {
      const found = element.querySelector(selector);
      if (found && found.textContent && found.textContent.trim().length >= 2) {
        textElement = found;
        break;
      }
    }

    if (!textElement) {
      // Fallback: find the main text node that contains our message
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const nodeText = node.textContent.trim();
        if (nodeText === originalText || 
            (nodeText.includes(originalText) && nodeText.length < originalText.length * 2)) {
          textElement = node.parentElement;
          break;
        }
      }
    }

    // Last resort: use the element itself if it contains the text
    if (!textElement && element.textContent && element.textContent.includes(originalText)) {
      // Find the direct child that contains the text
      for (const child of Array.from(element.children)) {
        if (child.textContent && child.textContent.includes(originalText)) {
          textElement = child;
          break;
        }
      }
      if (!textElement) {
        textElement = element;
      }
    }

    if (textElement) {
      // Store original text
      if (!textElement.dataset.originalText) {
        textElement.dataset.originalText = originalText;
      }

      // Apply translation - replace the original text
      const currentText = textElement.textContent || '';
      if (currentText.includes(originalText)) {
        textElement.textContent = currentText.replace(originalText, translatedText);
      } else {
        // If exact match not found, try to replace the whole text if it's similar
        textElement.textContent = translatedText;
      }

      // Add translation indicator if not already present
      if (!textElement.querySelector('.translation-indicator') && 
          !element.querySelector('.translation-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'translation-indicator';
        indicator.textContent = ' 🌐';
        indicator.title = `Translated from: ${originalText}`;
        indicator.style.cssText = 'opacity: 0.6; font-size: 0.9em; cursor: help; margin-left: 2px; display: inline-block;';
        
        // Try to append to textElement, fallback to element
        if (textElement.appendChild) {
          textElement.appendChild(indicator);
        } else if (element.appendChild) {
          element.appendChild(indicator);
        }
      }

      element.dataset.translated = 'true';
      element.dataset.translating = 'false';
      console.log('[Twitch Translator] Translated:', originalText.substring(0, 50), '->', translatedText.substring(0, 50));
    } else {
      console.warn('[Twitch Translator] Could not find text element to translate');
      element.dataset.translating = 'false';
    }
  }

  function translateText(text, targetLang) {
    return new Promise((resolve, reject) => {
      // Use Google Translate API
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && data[0] && data[0][0] && data[0][0][0]) {
            const translated = data[0].map(item => item[0]).join('');
            resolve(translated || data[0][0][0]);
          } else {
            console.error('[Twitch Translator] Invalid translation response:', data);
            reject(new Error('Invalid translation response'));
          }
        })
        .catch(error => {
          console.error('[Twitch Translator] Translation API error:', error);
          reject(error);
        });
    });
  }

  function translateAllMessages() {
    if (!enabled) return;
    translatedMessages.clear();
    
    // Remove translation markers
    document.querySelectorAll('[data-translated="true"]').forEach(el => {
      el.dataset.translated = 'false';
      const indicator = el.querySelector('.translation-indicator');
      if (indicator) indicator.remove();
      
      // Restore original text if available
      const textEl = el.querySelector('[data-original-text]');
      if (textEl && textEl.dataset.originalText) {
        textEl.textContent = textEl.dataset.originalText;
        delete textEl.dataset.originalText;
      }
    });

    // Re-translate after a short delay
    setTimeout(() => {
      scanAndTranslate();
    }, 500);
  }

  // Start observing when page loads
  console.log('[Twitch Translator] Content script loaded');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Twitch Translator] DOM loaded');
      setTimeout(() => {
        if (enabled) startObserving();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      if (enabled) startObserving();
    }, 1000);
  }

  // Also try when page becomes visible (for SPA navigation)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabled && !observer) {
      setTimeout(() => startObserving(), 500);
    }
  });
})();

