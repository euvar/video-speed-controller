// Background script for Manifest V3 (Chrome, Edge, etc.)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    settings: {
      defaultSpeed: 1.0,
      speedStep: 0.10,
      rememberSpeed: true,
      showIndicator: true,
      showPersistentIndicator: true,
      shortcuts: {
        speedUp: 'd',
        speedDown: 's',
        reset: 'r',
        rewind: 'a',
        advance: 'f',
        toggleIndicator: 'v'
      }
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (data) => {
      sendResponse(data.settings);
    });
    return true;
  }
});