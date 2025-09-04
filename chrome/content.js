// Video Speed Controller - Content Script

let currentSpeed = 1.0;
let speedIndicators = new Map();
let temporaryIndicator = null;
let indicatorTimeout = null;
let settings = {
  defaultSpeed: 1.0,
  speedStep: 0.10,
  rememberSpeed: false,
  showIndicator: true,
  showPersistentIndicator: true,
  shortcuts: {
    speedUp: 'd',
    speedDown: 's',
    reset: 'r',
    toggleIndicator: 'v'
  }
};

// Load settings
browser.storage.sync.get(['settings', 'lastSpeed']).then((data) => {
  if (data.settings) {
    settings = { ...settings, ...data.settings };
  }
  if (data.lastSpeed && settings.rememberSpeed) {
    currentSpeed = data.lastSpeed;
    // Apply speed to existing videos
    setTimeout(() => applySpeedToAllVideos(), 500);
  }
});

// Save indicator positions
const indicatorPositions = new Map();
// Auto-hide timers
const hideTimers = new Map();

function createPersistentIndicator(video) {
  // Check if indicator already exists for this video
  if (speedIndicators.has(video)) {
    const existingIndicator = speedIndicators.get(video);
    if (existingIndicator && existingIndicator.parentNode) {
      // Just update the text
      existingIndicator.textContent = currentSpeed.toFixed(2);
      return existingIndicator;
    }
  }

  const indicator = document.createElement('div');
  indicator.className = 'vsc-persistent-indicator';
  
  // Base styles via setAttribute to avoid CSP issues
  indicator.setAttribute('style', `
    position: absolute !important;
    top: 10px !important;
    left: 10px !important;
    background: rgba(0, 0, 0, 0.2) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    padding: 6px 12px !important;
    border-radius: 14px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    z-index: 2147483647 !important;
    cursor: move !important;
    user-select: none !important;
    opacity: ${settings.showPersistentIndicator ? '0.6' : '0'} !important;
    transition: opacity 0.3s, box-shadow 0.2s, background 0.2s !important;
    line-height: 1 !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  `);
  
  indicator.textContent = currentSpeed.toFixed(2);
  
  // Find video container
  let container = video.parentElement;
  
  // For YouTube find specific container
  if (window.location.hostname.includes('youtube.com')) {
    let ytPlayer = video.closest('#movie_player, .html5-video-player');
    if (ytPlayer) {
      container = ytPlayer;
    }
  }
  
  // Ensure container has position relative/absolute
  const position = window.getComputedStyle(container).position;
  if (position === 'static') {
    container.style.position = 'relative';
  }
  
  // Restore position if saved
  const savedPos = indicatorPositions.get(video);
  if (savedPos) {
    indicator.style.left = savedPos.left + 'px';
    indicator.style.top = savedPos.top + 'px';
  }
  
  // Make indicator draggable
  makeIndicatorDraggable(indicator, video, container);
  
  container.appendChild(indicator);
  speedIndicators.set(video, indicator);
  
  // Start auto-hide
  startAutoHide(indicator, video);
  
  return indicator;
}

function startAutoHide(indicator, video) {
  // Clear previous timer if exists
  const existingTimer = hideTimers.get(video);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  
  // Start new timer
  const timer = setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.style.transition = 'opacity 0.5s ease-out';
      indicator.style.opacity = '0';
    }
  }, 2000);
  
  hideTimers.set(video, timer);
}

function showIndicator(indicator, video) {
  if (!indicator || !indicator.parentNode) return;
  
  // Show indicator
  indicator.style.transition = 'opacity 0.3s ease-in';
  indicator.style.opacity = '0.6';
  
  // Restart auto-hide
  startAutoHide(indicator, video);
}

function makeIndicatorDraggable(indicator, video, container) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  let rafId = null;
  let currentX, currentY;
  
  indicator.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = indicator.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    initialLeft = rect.left - containerRect.left;
    initialTop = rect.top - containerRect.top;
    
    // Cancel auto-hide when dragging
    const timer = hideTimers.get(video);
    if (timer) {
      clearTimeout(timer);
    }
    
    // Add dragging effects
    indicator.classList.add('vsc-dragging');
    indicator.style.transition = 'none';
    indicator.style.opacity = '0.8';
    indicator.style.background = 'rgba(0, 0, 0, 0.3)';
    indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    currentX = e.clientX;
    currentY = e.clientY;
    
    // Cancel previous requestAnimationFrame
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    // Use requestAnimationFrame for smooth animation
    rafId = requestAnimationFrame(() => {
      if (!isDragging) return;
      
      const containerRect = container.getBoundingClientRect();
      const indicatorRect = indicator.getBoundingClientRect();
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;
      
      // Keep indicator within container bounds
      newLeft = Math.max(0, Math.min(newLeft, containerRect.width - indicatorRect.width));
      newTop = Math.max(0, Math.min(newTop, containerRect.height - indicatorRect.height));
      
      indicator.style.left = newLeft + 'px';
      indicator.style.top = newTop + 'px';
      
      // Save position
      indicatorPositions.set(video, { left: newLeft, top: newTop });
    });
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    
    // Remove dragging effects
    indicator.classList.remove('vsc-dragging');
    indicator.style.transition = 'opacity 0.3s, box-shadow 0.2s, background 0.2s';
    indicator.style.opacity = '0.6';
    indicator.style.background = 'rgba(0, 0, 0, 0.2)';
    indicator.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    
    // Restart auto-hide
    startAutoHide(indicator, video);
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });
  
  // Cancel auto-hide on hover
  indicator.addEventListener('mouseenter', () => {
    const timer = hideTimers.get(video);
    if (timer) {
      clearTimeout(timer);
    }
    indicator.style.opacity = '0.8';
  });
  
  indicator.addEventListener('mouseleave', () => {
    if (!isDragging) {
      indicator.style.opacity = '0.6';
      startAutoHide(indicator, video);
    }
  });
}

function updatePersistentIndicators(showAll = false) {
  speedIndicators.forEach((indicator, video) => {
    if (indicator && indicator.parentNode) {
      indicator.textContent = currentSpeed.toFixed(2);
      
      if (showAll) {
        // Show indicator when speed changes
        showIndicator(indicator, video);
      } else if (!showAll) {
        // Normal update without showing
        indicator.style.opacity = settings.showPersistentIndicator ? '0.6' : '0';
      }
    }
  });
}

function updateVideoSpeed(video, speed) {
  if (video && !isNaN(speed)) {
    try {
      // Limit speed from 0.07 to 10
      speed = Math.max(0.07, Math.min(10, speed));
      
      // For YouTube try to set speed via player API
      if (window.location.hostname.includes('youtube.com')) {
        const ytPlayer = video.closest('.html5-video-player');
        if (ytPlayer && ytPlayer.setPlaybackRate) {
          ytPlayer.setPlaybackRate(speed);
        }
      }
      
      video.playbackRate = speed;
      
      // Update indicator on video
      if (!speedIndicators.has(video) || !speedIndicators.get(video).parentNode) {
        createPersistentIndicator(video);
      }
      updatePersistentIndicators(true); // Show indicator when speed changes
      
      if (settings.rememberSpeed) {
        browser.storage.sync.set({ lastSpeed: speed });
      }
    } catch (e) {
      console.error('[VSC] Error setting speed:', e);
    }
  }
}

function getAllVideos() {
  return Array.from(document.querySelectorAll('video'));
}

function applySpeedToAllVideos() {
  const videos = getAllVideos();
  videos.forEach(video => {
    updateVideoSpeed(video, currentSpeed);
  });
}

function changeSpeed(delta) {
  currentSpeed = Math.max(0.07, Math.min(10, currentSpeed + delta));
  currentSpeed = Math.round(currentSpeed * 100) / 100;
  applySpeedToAllVideos();
}

function resetSpeed() {
  currentSpeed = 1.0;
  applySpeedToAllVideos();
}

function seekVideo(seconds) {
  const videos = getAllVideos();
  videos.forEach(video => {
    if (video && !isNaN(video.duration)) {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    }
  });
}

function togglePersistentIndicator() {
  settings.showPersistentIndicator = !settings.showPersistentIndicator;
  browser.storage.sync.set({ 
    settings: { ...settings, showPersistentIndicator: settings.showPersistentIndicator } 
  });
  updatePersistentIndicators();
}

// Keyboard handler with maximum priority
function handleKeydown(event) {
  // Ignore modifier keys
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  
  // Ignore input in text fields
  if (event.target.matches('input, textarea, select, [contenteditable]')) {
    return;
  }
  
  // For YouTube also check search focus
  if (window.location.hostname.includes('youtube.com')) {
    const searchBox = document.querySelector('input#search');
    if (searchBox && searchBox === document.activeElement) {
      return;
    }
  }
  
  const key = event.key.toLowerCase();
  
  // Support both keyboard layouts
  const keyMap = {
    's': ['s', 'ы'],
    'd': ['d', 'в'],
    'r': ['r', 'к'],
    'v': ['v', 'м']
  };
  
  // Check if key matches any layout
  const matchesKey = (shortcut, pressedKey) => {
    const shortcuts = keyMap[shortcut] || [shortcut];
    return shortcuts.includes(pressedKey);
  };
  
  if (matchesKey(settings.shortcuts.speedUp, key)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    changeSpeed(settings.speedStep);
  } else if (matchesKey(settings.shortcuts.speedDown, key)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    changeSpeed(-settings.speedStep);
  } else if (matchesKey(settings.shortcuts.reset, key)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    resetSpeed();
  } else if (matchesKey(settings.shortcuts.toggleIndicator, key)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    togglePersistentIndicator();
  }
}

// Register keyboard handler with capture phase
document.addEventListener('keydown', handleKeydown, true);

// Initialize videos when DOM is ready
function initializeVideos() {
  const videos = getAllVideos();
  videos.forEach(video => {
    if (!video.hasAttribute('data-vsc-initialized')) {
      video.setAttribute('data-vsc-initialized', 'true');
      
      // Set initial speed
      updateVideoSpeed(video, currentSpeed);
      
      // Monitor external speed changes
      video.addEventListener('ratechange', () => {
        if (Math.abs(video.playbackRate - currentSpeed) > 0.01) {
          currentSpeed = video.playbackRate;
          updatePersistentIndicators();
          if (settings.rememberSpeed) {
            browser.storage.sync.set({ lastSpeed: currentSpeed });
          }
        }
      });
    }
  });
}

// Watch for new videos
const videoObserver = new MutationObserver((mutations) => {
  let hasNewVideos = false;
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'VIDEO' || (node.querySelectorAll && node.querySelectorAll('video').length > 0)) {
          hasNewVideos = true;
          break;
        }
      }
    }
  }
  
  if (hasNewVideos) {
    setTimeout(initializeVideos, 100);
  }
});

// Message handler
browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    settings = { ...settings, ...request.settings };
    updatePersistentIndicators();
  } else if (request.action === 'getSpeed') {
    sendResponse({ speed: currentSpeed });
  } else if (request.action === 'setSpeed') {
    currentSpeed = request.speed;
    applySpeedToAllVideos();
  }
  
  return true;
});

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeVideos();
    videoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} else {
  initializeVideos();
  videoObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle YouTube navigation
if (window.location.hostname.includes('youtube.com')) {
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      
      // Reapply speed to all videos after navigation
      setTimeout(() => {
        applySpeedToAllVideos();
      }, 1000);
    }
  });
  
  urlObserver.observe(document.querySelector('head > title'), {
    subtree: true,
    characterData: true,
    childList: true
  });
}