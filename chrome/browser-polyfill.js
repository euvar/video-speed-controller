// Enhanced browser API polyfill for cross-browser compatibility
(function() {
  // Check if we're in a browser extension context
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // We're in Chrome, Edge, or another Chromium-based browser
    if (typeof browser === 'undefined') {
      window.browser = chrome;
    }
  } else if (typeof browser !== 'undefined') {
    // We're in Firefox or another browser with the browser API
    // No action needed
  } else {
    console.error('No browser extension API found');
  }
  
  // Ensure browser API uses promises in Chrome
  if (window.browser && window.browser.runtime && window.browser.runtime.getPlatformInfo && !window.browser.runtime.getPlatformInfo.bind) {
    // Chrome uses callbacks, let's promisify some common methods
    const promisify = (method) => {
      return function(...args) {
        return new Promise((resolve, reject) => {
          method.call(this, ...args, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      };
    };
    
    // Promisify storage methods if needed
    if (browser.storage && browser.storage.sync && !browser.storage.sync.get.bind) {
      const originalGet = browser.storage.sync.get;
      const originalSet = browser.storage.sync.set;
      
      browser.storage.sync.get = promisify(originalGet.bind(browser.storage.sync));
      browser.storage.sync.set = promisify(originalSet.bind(browser.storage.sync));
    }
  }
})();