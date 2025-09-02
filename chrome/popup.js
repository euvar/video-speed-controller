let currentSpeed = 1.0;
let currentLang = 'en';

const translations = {
  ru: {
    currentSpeed: 'Текущая скорость',
    reset: 'Сбросить (1.0)',
    shortcuts: 'Горячие клавиши',
    slowDown: 'Замедлить',
    speedUp: 'Ускорить',
    resetSpeed: 'Сбросить скорость',
    rewind: 'Назад на 10 сек',
    forward: 'Вперед на 10 сек',
    toggleIndicator: 'Показать/скрыть индикатор',
    settings: 'Настройки',
    rememberSpeed: 'Запоминать скорость',
    showIndicator: 'Показывать индикатор скорости'
  },
  en: {
    currentSpeed: 'Current Speed',
    reset: 'Reset (1.0)',
    shortcuts: 'Keyboard Shortcuts',
    slowDown: 'Slow down',
    speedUp: 'Speed up',
    resetSpeed: 'Reset speed',
    rewind: 'Rewind 10 sec',
    forward: 'Forward 10 sec',
    toggleIndicator: 'Toggle indicator',
    settings: 'Settings',
    rememberSpeed: 'Remember speed',
    showIndicator: 'Show speed indicator'
  }
};

const speedDisplay = document.getElementById('current-speed');
const speedSlider = document.getElementById('speed-slider');
const speedUpBtn = document.getElementById('speed-up');
const speedDownBtn = document.getElementById('speed-down');
const resetBtn = document.getElementById('reset-speed');
const rememberSpeedCheckbox = document.getElementById('remember-speed');
const showIndicatorCheckbox = document.getElementById('show-indicator');
const langToggle = document.getElementById('lang-toggle');

function updateLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      element.textContent = translations[currentLang][key];
    }
  });
  langToggle.textContent = currentLang === 'ru' ? 'EN' : 'RU';
  browser.storage.sync.set({ language: currentLang });
}

function updateSpeedDisplay(speed) {
  speedDisplay.textContent = speed.toFixed(2);
  speedSlider.value = speed;
}

function sendSpeedToContent(speed) {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, {
        action: 'setSpeed',
        speed: speed
      }, (response) => {
        if (browser.runtime.lastError) {
          console.log('Error sending speed:', browser.runtime.lastError);
        }
      });
    }
  });
}

function updateSettings() {
  const settings = {
    rememberSpeed: rememberSpeedCheckbox.checked,
    showIndicator: showIndicatorCheckbox.checked
  };
  
  browser.storage.sync.set({ settings });
  
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {
      action: 'updateSettings',
      settings: settings
    });
  });
}

// Загружаем язык
browser.storage.sync.get(['language'], (data) => {
  if (data.language) {
    currentLang = data.language;
    updateLanguage();
  }
});

// Ждем немного перед запросом скорости, чтобы content script успел загрузиться
setTimeout(() => {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { action: 'getSpeed' }, (response) => {
        if (browser.runtime.lastError) {
          console.log('Content script not ready yet');
          return;
        }
        if (response && response.speed) {
          currentSpeed = response.speed;
          updateSpeedDisplay(currentSpeed);
        }
      });
    }
  });
}, 100);

browser.storage.sync.get(['settings'], (data) => {
  if (data.settings) {
    rememberSpeedCheckbox.checked = data.settings.rememberSpeed === true;
    showIndicatorCheckbox.checked = data.settings.showIndicator !== false;
  }
});

langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'ru' ? 'en' : 'ru';
  updateLanguage();
});

speedSlider.addEventListener('input', (e) => {
  currentSpeed = parseFloat(e.target.value);
  updateSpeedDisplay(currentSpeed);
  sendSpeedToContent(currentSpeed);
});

speedUpBtn.addEventListener('click', () => {
  currentSpeed = Math.min(10, currentSpeed + 0.10);
  currentSpeed = Math.round(currentSpeed * 100) / 100;
  updateSpeedDisplay(currentSpeed);
  sendSpeedToContent(currentSpeed);
});

speedDownBtn.addEventListener('click', () => {
  currentSpeed = Math.max(0.07, currentSpeed - 0.10);
  currentSpeed = Math.round(currentSpeed * 100) / 100;
  updateSpeedDisplay(currentSpeed);
  sendSpeedToContent(currentSpeed);
});

resetBtn.addEventListener('click', () => {
  currentSpeed = 1.0;
  updateSpeedDisplay(currentSpeed);
  sendSpeedToContent(currentSpeed);
});

rememberSpeedCheckbox.addEventListener('change', updateSettings);
showIndicatorCheckbox.addEventListener('change', updateSettings);

// Обработчики для preset кнопок
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentSpeed = parseFloat(e.target.dataset.speed);
    updateSpeedDisplay(currentSpeed);
    sendSpeedToContent(currentSpeed);
  });
});

// Применяем язык по умолчанию при загрузке
updateLanguage();