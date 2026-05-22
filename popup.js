// تنظیمات پیش‌فرض
const defaultSettings = {
  enabled: true,
  fontFamily: 'Vazir',
  fontSize: 16,
  customFont: { name: '', url: '' },
  englishFontEnabled: false,
  englishFontFamily: 'Arial',
  customEnglishFont: { name: '', url: '' }
};

const enableToggle = document.getElementById('enableExtension');
const fontSelect = document.getElementById('fontSelect');
const customFontBox = document.getElementById('customFontBox');
const customFontName = document.getElementById('customFontName');
const customFontUrl = document.getElementById('customFontUrl');
const applyCustomFontBtn = document.getElementById('applyCustomFont');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const previewPersian = document.getElementById('previewPersian');
const resetBtn = document.getElementById('resetBtn');
const applyBtn = document.getElementById('applyBtn');
const statusMsg = document.getElementById('statusMsg');

const enableEnglishFontChk = document.getElementById('enableEnglishFont');
const englishFontSelect = document.getElementById('englishFontSelect');
const customEnglishFontBox = document.getElementById('customEnglishFontBox');
const customEnglishFontName = document.getElementById('customEnglishFontName');
const customEnglishFontUrl = document.getElementById('customEnglishFontUrl');
const applyCustomEnglishFontBtn = document.getElementById('applyCustomEnglishFont');

let currentSettings = { ...defaultSettings };

async function loadSettings() {
  const result = await chrome.storage.sync.get('persianChatSettings');
  if (result.persianChatSettings) {
    currentSettings = { ...defaultSettings, ...result.persianChatSettings };
  } else {
    currentSettings = { ...defaultSettings };
  }
  applySettingsToUI();
}

async function saveSettings() {
  await chrome.storage.sync.set({ persianChatSettings: currentSettings });
  showStatus('تنظیمات ذخیره شد', '#10b981');
}

function showStatus(msg, color = '#3b82f6') {
  statusMsg.textContent = msg;
  statusMsg.style.color = color;
  setTimeout(() => {
    if (statusMsg.textContent === msg) {
      statusMsg.textContent = '✅ آماده';
      statusMsg.style.color = '';
    }
  }, 2000);
}

function applySettingsToUI() {
  enableToggle.checked = currentSettings.enabled;
  fontSizeSlider.value = currentSettings.fontSize;
  fontSizeValue.textContent = currentSettings.fontSize + 'px';

  const isCustom = !['Vazir', 'Sahel', 'IranSans', 'Tahoma'].includes(currentSettings.fontFamily);
  if (isCustom && currentSettings.customFont.name) {
    fontSelect.value = 'custom';
    customFontBox.style.display = 'flex';
    customFontName.value = currentSettings.customFont.name;
    customFontUrl.value = currentSettings.customFont.url;
  } else {
    fontSelect.value = currentSettings.fontFamily;
    customFontBox.style.display = 'none';
  }

  enableEnglishFontChk.checked = currentSettings.englishFontEnabled;
  englishFontSelect.disabled = !currentSettings.englishFontEnabled;
  const isEngCustom = !['Arial', 'Roboto', "'Segoe UI'", "'Courier New'", "'Times New Roman'"].includes(currentSettings.englishFontFamily);
  if (isEngCustom && currentSettings.customEnglishFont.name) {
    englishFontSelect.value = 'custom-eng';
    customEnglishFontBox.style.display = 'flex';
    customEnglishFontName.value = currentSettings.customEnglishFont.name;
    customEnglishFontUrl.value = currentSettings.customEnglishFont.url;
  } else {
    englishFontSelect.value = currentSettings.englishFontFamily;
    customEnglishFontBox.style.display = 'none';
  }

  updatePreview();
}

function updatePreview() {
  let persianFont = currentSettings.fontFamily;
  if (persianFont === 'custom' && currentSettings.customFont.name) {
    persianFont = currentSettings.customFont.name;
  }
  let englishFont = currentSettings.englishFontEnabled ? 
    (currentSettings.englishFontFamily === 'custom-eng' ? currentSettings.customEnglishFont.name : currentSettings.englishFontFamily) 
    : persianFont;

  previewPersian.style.fontFamily = `'${persianFont}', 'Vazir', Tahoma, sans-serif`;
  previewPersian.style.fontSize = currentSettings.fontSize + 'px';
  previewPersian.style.direction = 'rtl';
  previewPersian.style.textAlign = 'right';
}

async function applyToCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await saveSettings();
  chrome.tabs.sendMessage(tab.id, {
    action: 'updateSettings',
    settings: currentSettings
  }, (response) => {
    if (chrome.runtime.lastError) {
      showStatus('خطا: صفحه را refresh کنید', '#ef4444');
    } else {
      showStatus('اعمال شد روی صفحه', '#10b981');
    }
  });
}

function resetToDefault() {
  currentSettings = { ...defaultSettings };
  applySettingsToUI();
  saveSettings();
  applyToCurrentTab();
  showStatus('ریست به پیش‌فرض', '#f59e0b');
}

async function addCustomFontToTab(url, name, isEnglish = false) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, {
    action: 'addCustomFont',
    fontUrl: url,
    fontName: name,
    isEnglish: isEnglish
  });
}

enableToggle.addEventListener('change', (e) => {
  currentSettings.enabled = e.target.checked;
  applyToCurrentTab();
});

fontSizeSlider.addEventListener('input', (e) => {
  currentSettings.fontSize = parseInt(e.target.value);
  fontSizeValue.textContent = currentSettings.fontSize + 'px';
  updatePreview();
});

fontSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'custom') {
    customFontBox.style.display = 'flex';
    currentSettings.fontFamily = 'custom';
  } else {
    customFontBox.style.display = 'none';
    currentSettings.fontFamily = val;
    currentSettings.customFont = { name: '', url: '' };
    updatePreview();
  }
});

applyCustomFontBtn.addEventListener('click', () => {
  const name = customFontName.value.trim();
  const url = customFontUrl.value.trim();
  if (!name || !url) { showStatus('نام و آدرس فونت فارسی را وارد کنید', '#ef4444'); return; }
  currentSettings.customFont = { name, url };
  currentSettings.fontFamily = 'custom';
  fontSelect.value = 'custom';
  updatePreview();
  addCustomFontToTab(url, name, false);
  showStatus('فونت سفارشی فارسی اضافه شد', '#10b981');
});

enableEnglishFontChk.addEventListener('change', (e) => {
  currentSettings.englishFontEnabled = e.target.checked;
  englishFontSelect.disabled = !e.target.checked;
  if (!e.target.checked) {
    customEnglishFontBox.style.display = 'none';
  }
  updatePreview();
});

englishFontSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'custom-eng') {
    customEnglishFontBox.style.display = 'flex';
    currentSettings.englishFontFamily = 'custom-eng';
  } else {
    customEnglishFontBox.style.display = 'none';
    currentSettings.englishFontFamily = val;
    currentSettings.customEnglishFont = { name: '', url: '' };
    updatePreview();
  }
});

applyCustomEnglishFontBtn.addEventListener('click', () => {
  const name = customEnglishFontName.value.trim();
  const url = customEnglishFontUrl.value.trim();
  if (!name || !url) { showStatus('نام و آدرس فونت انگلیسی را وارد کنید', '#ef4444'); return; }
  currentSettings.customEnglishFont = { name, url };
  currentSettings.englishFontFamily = 'custom-eng';
  currentSettings.englishFontEnabled = true;
  enableEnglishFontChk.checked = true;
  englishFontSelect.disabled = false;
  englishFontSelect.value = 'custom-eng';
  updatePreview();
  addCustomFontToTab(url, name, true);
  showStatus('فونت سفارشی انگلیسی اضافه شد', '#10b981');
});

resetBtn.addEventListener('click', resetToDefault);
applyBtn.addEventListener('click', applyToCurrentTab);

loadSettings();