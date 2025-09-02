// Wrapper для Chrome - загружаем polyfill перед основным скриптом
(function() {
  // Убеждаемся что browser API доступен
  if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    window.browser = chrome;
  }
  
  // Загружаем основной content script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();