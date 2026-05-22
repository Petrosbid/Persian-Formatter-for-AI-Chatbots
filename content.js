function isPersian(text) {
  const persianRegex = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

function isInsideCodeBlock(element) {
  if (element.tagName === 'PRE' || element.tagName === 'CODE') {
    return true;
  }
  const codeClasses = [
    'code-block', 'highlight', 'syntax-highlight', 'language-', 
    'prettyprint', 'source-code', 'code', 'pre'
  ];
  const classNames = element.className || '';
  for (let cls of codeClasses) {
    if (classNames.includes(cls)) return true;
  }
  let parent = element.parentElement;
  let level = 0;
  while (parent && level < 5) {
    if (parent.tagName === 'PRE' || parent.tagName === 'CODE') return true;
    const parentClass = parent.className || '';
    for (let cls of codeClasses) {
      if (parentClass.includes(cls)) return true;
    }
    parent = parent.parentElement;
    level++;
  }
  return false;
}

let currentSettings = {
  enabled: true,
  fontFamily: 'Vazir',
  fontSize: 16,
  customFont: { name: '', url: '' },
  englishFontEnabled: false,
  englishFontFamily: 'Arial',
  customEnglishFont: { name: '', url: '' }
};

// تزریق فونت (عمومی)
function injectFontCSS(url) {
  if (!url) return;
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}

function applyPersianStyle(element) {
  if (!currentSettings.enabled) return;
  if (element.getAttribute('data-rtl-processed') === 'true') return;
  
  if (isInsideCodeBlock(element)) return;
  
  const text = element.innerText || element.textContent;
  if (!text) return;
  
  const hasPersian = isPersian(text);
  if (!hasPersian && !currentSettings.englishFontEnabled) return;
  
  let appliedFont = currentSettings.fontFamily;
  let direction = 'ltr';
  let textAlign = 'left';
  
  if (hasPersian) {
    direction = 'rtl';
    textAlign = 'right';
    if (currentSettings.fontFamily === 'custom' && currentSettings.customFont.name) {
      appliedFont = currentSettings.customFont.name;
    } else {
      appliedFont = currentSettings.fontFamily;
    }
  } else {
    if (currentSettings.englishFontEnabled) {
      if (currentSettings.englishFontFamily === 'custom-eng' && currentSettings.customEnglishFont.name) {
        appliedFont = currentSettings.customEnglishFont.name;
      } else {
        appliedFont = currentSettings.englishFontFamily;
      }
    } else {
      appliedFont = currentSettings.fontFamily;
    }
    direction = 'ltr';
    textAlign = 'left';
  }
  
  element.style.direction = direction;
  element.style.textAlign = textAlign;
  element.style.fontFamily = `'${appliedFont}', 'Vazir', 'Arial', sans-serif`;
  element.style.fontSize = currentSettings.fontSize + 'px';
  
  if (hasPersian) {
    element.style.paddingRight = '8px';
    element.style.paddingLeft = '4px';
  } else {
    element.style.paddingRight = '4px';
    element.style.paddingLeft = '8px';
  }
  
  if (hasPersian && (element.tagName === 'UL' || element.tagName === 'OL')) {
    element.style.listStylePosition = 'outside';
    element.style.paddingRight = '1.5rem';
    element.style.paddingLeft = '0';
    element.style.paddingInlineStart = '0';
    element.style.marginRight = '0';
  }
  if (hasPersian && element.tagName === 'LI') {
    element.style.textAlign = 'right';
    element.style.direction = 'rtl';
  }
  
  element.setAttribute('data-rtl-processed', 'true');
}

function processAllElements() {
  const selectors = [
    'p', 'div.message', 'div[data-message-author-role]', 
    '.prose', '.markdown', '.text-base', '.whitespace-pre-wrap',
    '.flex-1', '.chat-message', '.result-streaming',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'
  ];
  const elements = document.querySelectorAll(selectors.join(','));
  elements.forEach(applyPersianStyle);
}

const globalStyle = document.createElement('style');
globalStyle.textContent = `
  ul[style*="direction: rtl"], ol[style*="direction: rtl"] {
    list-style-position: outside !important;
    padding-right: 1.5rem !important;
    padding-left: 0 !important;
    text-align: right !important;
  }
`;
document.head.appendChild(globalStyle);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      processAllElements();
      break;
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });

async function loadContentSettings() {
  const result = await chrome.storage.sync.get('persianChatSettings');
  if (result.persianChatSettings) {
    currentSettings = result.persianChatSettings;
  }
  if (currentSettings.customFont && currentSettings.customFont.url) {
    injectFontCSS(currentSettings.customFont.url);
  }
  if (currentSettings.englishFontEnabled && currentSettings.customEnglishFont && currentSettings.customEnglishFont.url) {
    injectFontCSS(currentSettings.customEnglishFont.url);
  }
  if (currentSettings.enabled) {
    processAllElements();
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentSettings = request.settings;
    document.querySelectorAll('[data-rtl-processed]').forEach(el => {
      el.removeAttribute('data-rtl-processed');
    });
    if (currentSettings.customFont?.url) injectFontCSS(currentSettings.customFont.url);
    if (currentSettings.englishFontEnabled && currentSettings.customEnglishFont?.url) injectFontCSS(currentSettings.customEnglishFont.url);
    if (currentSettings.enabled) {
      processAllElements();
    } else {
      location.reload();
    }
    sendResponse({ status: 'ok' });
  }
  if (request.action === 'addCustomFont') {
    injectFontCSS(request.fontUrl);
    sendResponse({ status: 'font added' });
  }
  return true;
});

loadContentSettings();

const vazirCSS = chrome.runtime.getURL('vazir-font/Vazirmatn-font-face.css');
const link = document.createElement('link');
link.href = vazirCSS;
link.rel = 'stylesheet';
document.head.appendChild(link);

