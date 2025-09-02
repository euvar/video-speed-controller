browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.set({
    settings: {
      defaultSpeed: 1.0,
      speedStep: 0.10,
      rememberSpeed: false,
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

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    browser.storage.sync.get(['settings'], (data) => {
      sendResponse(data.settings);
    });
    return true;
  }
});