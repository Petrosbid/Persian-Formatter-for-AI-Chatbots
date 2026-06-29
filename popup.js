const STORAGE_SETTINGS_KEY = "persianAiToolkitSettings";
const STORAGE_PROMPTS_KEY = "promptVaultItems";
const STORAGE_DYNAMIC_SITES_KEY = "supportedChatbotDomains";

const DEFAULT_SETTINGS = {
  enabled: true,
  realtimeInputRtl: true,
  fontFamily: "Vazirmatn",
  fontSize: 16,
  customFont: { name: "", url: "" },
  englishFontEnabled: false,
  englishFontFamily: "Inter",
  customEnglishFont: { name: "", url: "" },
};

const BUILTIN_CHATBOT_HOSTS = new Set([
  "chat.openai.com",
  "chatgpt.com",
  "claude.ai",
  "gemini.google.com",
  "poe.com",
  "chat.deepseek.com",
  "github.com",
]);

const AI_HOST_HINTS = [
  "chat",
  "gpt",
  "claude",
  "gemini",
  "copilot",
  "deepseek",
  "poe",
  "ai",
];

const els = {
  statusText: document.getElementById("statusText"),
  activeSiteLabel: document.getElementById("activeSiteLabel"),
  dynamicSiteCard: document.getElementById("dynamicSiteCard"),
  addChatbotBtn: document.getElementById("addChatbotBtn"),

  tabs: Array.from(document.querySelectorAll(".tab-btn")),
  panels: {
    config: document.getElementById("panel-config"),
    vault: document.getElementById("panel-vault"),
    toolkit: document.getElementById("panel-toolkit"),
  },

  enableExtension: document.getElementById("enableExtension"),
  realtimeInputRtl: document.getElementById("realtimeInputRtl"),
  fontSelect: document.getElementById("fontSelect"),
  customFontBox: document.getElementById("customFontBox"),
  customFontName: document.getElementById("customFontName"),
  customFontUrl: document.getElementById("customFontUrl"),
  fontSizeSlider: document.getElementById("fontSizeSlider"),
  fontSizeValue: document.getElementById("fontSizeValue"),
  englishFontEnabled: document.getElementById("englishFontEnabled"),
  englishFontSelect: document.getElementById("englishFontSelect"),
  customEnglishFontBox: document.getElementById("customEnglishFontBox"),
  customEnglishFontName: document.getElementById("customEnglishFontName"),
  customEnglishFontUrl: document.getElementById("customEnglishFontUrl"),
  resetBtn: document.getElementById("resetBtn"),
  saveApplyBtn: document.getElementById("saveApplyBtn"),

  promptTitle: document.getElementById("promptTitle"),
  promptContent: document.getElementById("promptContent"),
  savePromptBtn: document.getElementById("savePromptBtn"),
  promptSearch: document.getElementById("promptSearch"),
  promptList: document.getElementById("promptList"),

  latexInput: document.getElementById("latexInput"),
  latexOutput: document.getElementById("latexOutput"),
  latexToPlainBtn: document.getElementById("latexToPlainBtn"),
  plainToLatexBtn: document.getElementById("plainToLatexBtn"),
  copyLatexOutputBtn: document.getElementById("copyLatexOutputBtn"),
  clearLatexBtn: document.getElementById("clearLatexBtn"),

  advancedCopyLatestBtn: document.getElementById("advancedCopyLatestBtn"),
  manualCopyInput: document.getElementById("manualCopyInput"),
  advancedCopyManualBtn: document.getElementById("advancedCopyManualBtn"),
};

let currentSettings = { ...DEFAULT_SETTINGS };
let promptItems = [];
let currentTab = null;
let currentUrl = null;
let currentDomainPattern = null;

function setStatus(message, kind = "info") {
  const map = {
    info: "#93c5fd",
    success: "#6ee7b7",
    warning: "#fbbf24",
    danger: "#fca5a5",
  };
  els.statusText.textContent = message;
  els.statusText.style.color = map[kind] || map.info;
}

function storageGet(keys) {
  return chrome.storage.sync.get(keys);
}

function storageSet(value) {
  return chrome.storage.sync.set(value);
}

function queryActiveTab() {
  return chrome.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => tabs[0] || null);
}

function sendTabMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function executeContentScript(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
}

function requestPermissionForOrigin(originPattern) {
  return new Promise((resolve) => {
    chrome.permissions.request({ origins: [originPattern] }, (granted) => {
      resolve(Boolean(granted));
    });
  });
}

function getRegisteredContentScripts() {
  return chrome.scripting.getRegisteredContentScripts();
}

function registerContentScript(entry) {
  return chrome.scripting.registerContentScripts([entry]);
}

function unregisterContentScript(id) {
  return chrome.scripting.unregisterContentScripts({ ids: [id] });
}

function uniqueId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugifyHost(host) {
  return host
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function hostFromPattern(pattern) {
  const m = String(pattern).match(/^https?:\/\/([^/]+)\/\*$/i);
  return m ? m[1].toLowerCase() : "";
}

function inferAiHost(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  const path = urlObj.pathname.toLowerCase();
  return AI_HOST_HINTS.some(
    (hint) => host.includes(hint) || path.includes(hint),
  );
}

function isSupportedHost(host, dynamicPatterns) {
  if (BUILTIN_CHATBOT_HOSTS.has(host)) return true;
  return dynamicPatterns.some((p) => hostFromPattern(p) === host);
}

function fallbackPromptTitle(content) {
  const snippet = content.replace(/\s+/g, " ").trim().slice(0, 36);
  if (snippet) return snippet;
  return new Date().toLocaleString("fa-IR");
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLatexToPlain(input) {
  if (!input) return "";

  const symbolMap = [
    [/\\times/g, "×"],
    [/\\cdot/g, "·"],
    [/\\alpha/g, "α"],
    [/\\beta/g, "β"],
    [/\\gamma/g, "γ"],
    [/\\delta/g, "δ"],
    [/\\theta/g, "θ"],
    [/\\lambda/g, "λ"],
    [/\\pi/g, "π"],
    [/\\sigma/g, "σ"],
    [/\\mu/g, "μ"],
    [/\\infty/g, "∞"],
    [/\\neq/g, "≠"],
    [/\\leq/g, "≤"],
    [/\\geq/g, "≥"],
    [/\\approx/g, "≈"],
  ];

  let out = String(input)
    .replace(/\$\$(.*?)\$\$/gs, "$1")
    .replace(/\$(.*?)\$/gs, "$1")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ");

  out = out.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");
  out = out.replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)");
  out = out.replace(/\^\{([^{}]+)\}/g, "^($1)");
  out = out.replace(/_\{([^{}]+)\}/g, "_($1)");

  for (const [pattern, replacement] of symbolMap) {
    out = out.replace(pattern, replacement);
  }

  return out
    .replace(/\\/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function plainToLatex(input) {
  if (!input) return "";

  let out = String(input).trim();

  const symbolMap = [
    [/×/g, "\\times "],
    [/·/g, "\\cdot "],
    [/α/g, "\\alpha "],
    [/β/g, "\\beta "],
    [/γ/g, "\\gamma "],
    [/δ/g, "\\delta "],
    [/θ/g, "\\theta "],
    [/λ/g, "\\lambda "],
    [/π/g, "\\pi "],
    [/σ/g, "\\sigma "],
    [/μ/g, "\\mu "],
    [/∞/g, "\\infty "],
    [/≠/g, "\\neq "],
    [/≤/g, "\\leq "],
    [/≥/g, "\\geq "],
    [/≈/g, "\\approx "],
  ];

  for (const [pattern, replacement] of symbolMap) {
    out = out.replace(pattern, replacement);
  }

  out = out.replace(/√\(([^()]+)\)/g, "\\sqrt{$1}");
  out = out.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, "\\frac{$1}{$2}");

  out = out
    .replace(/\^\(([^()]+)\)/g, "^{$1}")
    .replace(/_\(([^()]+)\)/g, "_{$1}")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!out.startsWith("$") && !out.endsWith("$")) {
    out = `$${out}$`;
  }
  return out;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  if (inList) html.push("</ul>");

  return `<div dir="rtl" style="direction:rtl;text-align:right;font-family:'Vazirmatn',Tahoma,sans-serif;line-height:1.9;">${html.join("")}</div>`;
}

async function copyDualMime(html, plain) {
  if (navigator.clipboard && typeof window.ClipboardItem === "function") {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }

  await navigator.clipboard.writeText(plain);
}

function applySettingsToUi() {
  els.enableExtension.checked = Boolean(currentSettings.enabled);
  els.realtimeInputRtl.checked = Boolean(currentSettings.realtimeInputRtl);

  els.fontSizeSlider.value = String(Number(currentSettings.fontSize) || 16);
  els.fontSizeValue.textContent = `${els.fontSizeSlider.value}px`;

  const knownPersianFonts = ["Vazirmatn", "Sahel", "IranSans", "Tahoma"];
  const isCustomPersian = !knownPersianFonts.includes(
    currentSettings.fontFamily,
  );
  els.fontSelect.value = isCustomPersian
    ? "custom"
    : currentSettings.fontFamily;
  els.customFontBox.classList.toggle("hidden", !isCustomPersian);
  els.customFontName.value = currentSettings.customFont?.name || "";
  els.customFontUrl.value = currentSettings.customFont?.url || "";

  els.englishFontEnabled.checked = Boolean(currentSettings.englishFontEnabled);
  els.englishFontSelect.disabled = !currentSettings.englishFontEnabled;

  const knownEnglishFonts = ["Inter", "Arial", "Roboto", "'Segoe UI'"];
  const isCustomEnglish = !knownEnglishFonts.includes(
    currentSettings.englishFontFamily,
  );
  els.englishFontSelect.value = isCustomEnglish
    ? "custom-eng"
    : currentSettings.englishFontFamily;
  els.customEnglishFontBox.classList.toggle("hidden", !isCustomEnglish);
  els.customEnglishFontName.value =
    currentSettings.customEnglishFont?.name || "";
  els.customEnglishFontUrl.value = currentSettings.customEnglishFont?.url || "";
}

function collectSettingsFromUi() {
  const next = {
    enabled: els.enableExtension.checked,
    realtimeInputRtl: els.realtimeInputRtl.checked,
    fontFamily: els.fontSelect.value,
    fontSize: Number(els.fontSizeSlider.value) || 16,
    customFont: {
      name: els.customFontName.value.trim(),
      url: els.customFontUrl.value.trim(),
    },
    englishFontEnabled: els.englishFontEnabled.checked,
    englishFontFamily: els.englishFontSelect.value,
    customEnglishFont: {
      name: els.customEnglishFontName.value.trim(),
      url: els.customEnglishFontUrl.value.trim(),
    },
  };

  if (next.fontFamily !== "custom") {
    next.customFont = { name: "", url: "" };
  }
  if (next.englishFontFamily !== "custom-eng") {
    next.customEnglishFont = { name: "", url: "" };
  }

  return next;
}

async function ensureContentScriptReady(tabId) {
  try {
    await sendTabMessage(tabId, { action: "ping" });
    return true;
  } catch {
    try {
      await executeContentScript(tabId);
      await sendTabMessage(tabId, { action: "ping" });
      return true;
    } catch {
      return false;
    }
  }
}

async function applySettingsToCurrentTab() {
  if (!currentTab?.id) {
    setStatus("No active tab", "danger");
    return;
  }

  currentSettings = collectSettingsFromUi();

  if (
    currentSettings.fontFamily === "custom" &&
    (!currentSettings.customFont.name || !currentSettings.customFont.url)
  ) {
    setStatus("Custom Persian font needs name and CSS URL", "warning");
    return;
  }

  if (
    currentSettings.englishFontEnabled &&
    currentSettings.englishFontFamily === "custom-eng" &&
    (!currentSettings.customEnglishFont.name ||
      !currentSettings.customEnglishFont.url)
  ) {
    setStatus("Custom English font needs name and CSS URL", "warning");
    return;
  }

  await storageSet({ [STORAGE_SETTINGS_KEY]: currentSettings });

  const ready = await ensureContentScriptReady(currentTab.id);
  if (!ready) {
    setStatus(
      "Settings saved, but script access is blocked on this page",
      "warning",
    );
    return;
  }

  try {
    await sendTabMessage(currentTab.id, {
      action: "updateSettings",
      settings: currentSettings,
    });
    setStatus("Settings saved and applied", "success");
  } catch {
    setStatus("Settings saved, apply failed on current tab", "warning");
  }
}

async function loadSettings() {
  const result = await storageGet(STORAGE_SETTINGS_KEY);
  currentSettings = {
    ...DEFAULT_SETTINGS,
    ...(result[STORAGE_SETTINGS_KEY] || {}),
  };
  applySettingsToUi();
}

async function loadPrompts() {
  const result = await storageGet(STORAGE_PROMPTS_KEY);
  promptItems = Array.isArray(result[STORAGE_PROMPTS_KEY])
    ? result[STORAGE_PROMPTS_KEY]
    : [];
  renderPromptList();
}

async function savePrompts() {
  await storageSet({ [STORAGE_PROMPTS_KEY]: promptItems });
}

function promptMatches(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    item.content.toLowerCase().includes(q)
  );
}

function renderPromptList() {
  const query = els.promptSearch.value || "";
  const filtered = promptItems.filter((item) => promptMatches(item, query));

  if (!filtered.length) {
    els.promptList.innerHTML = `<div class="empty-state">No prompts found</div>`;
    return;
  }

  els.promptList.innerHTML = filtered
    .map(
      (item) => `
      <article class="prompt-item" role="listitem" data-id="${escapeHtml(item.id)}">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.content)}</p>
        <div class="prompt-actions">
          <button class="btn btn-mini btn-soft" data-action="inject">Inject into Chat</button>
          <button class="btn btn-mini btn-soft" data-action="copy">Copy</button>
          <button class="btn btn-mini btn-danger" data-action="delete">Delete</button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function savePromptFromForm() {
  const content = els.promptContent.value.trim();
  const title = els.promptTitle.value.trim();

  if (!content) {
    setStatus("Prompt content is required", "warning");
    return;
  }

  const item = {
    id: uniqueId(),
    title: title || fallbackPromptTitle(content),
    content,
    createdAt: new Date().toISOString(),
  };

  promptItems.unshift(item);
  await savePrompts();

  els.promptTitle.value = "";
  els.promptContent.value = "";

  renderPromptList();
  setStatus("Prompt saved to vault", "success");
}

async function injectPromptToActiveTab(promptText) {
  if (!currentTab?.id) {
    setStatus("No active tab", "danger");
    return;
  }

  const ready = await ensureContentScriptReady(currentTab.id);
  if (!ready) {
    setStatus("Could not access page input", "danger");
    return;
  }

  try {
    const response = await sendTabMessage(currentTab.id, {
      action: "injectPrompt",
      text: promptText,
    });
    if (response?.ok) {
      setStatus("Prompt injected", "success");
    } else {
      setStatus(response?.error || "Prompt injection failed", "warning");
    }
  } catch (error) {
    setStatus(error.message || "Prompt injection failed", "danger");
  }
}

async function requestAndRegisterDynamicHost() {
  if (!currentTab?.id || !currentUrl || !currentDomainPattern) {
    setStatus("Active domain is not available", "danger");
    return;
  }

  const granted = await requestPermissionForOrigin(currentDomainPattern);
  if (!granted) {
    setStatus("Permission was denied", "warning");
    return;
  }

  const result = await storageGet(STORAGE_DYNAMIC_SITES_KEY);
  const saved = Array.isArray(result[STORAGE_DYNAMIC_SITES_KEY])
    ? result[STORAGE_DYNAMIC_SITES_KEY]
    : [];
  if (!saved.includes(currentDomainPattern)) {
    saved.push(currentDomainPattern);
    await storageSet({ [STORAGE_DYNAMIC_SITES_KEY]: saved });
  }

  const host = new URL(currentUrl).hostname;
  const scriptId = `dynamic-${slugifyHost(host)}`;
  const entry = {
    id: scriptId,
    js: ["content.js"],
    matches: [currentDomainPattern],
    runAt: "document_end",
    persistAcrossSessions: true,
  };

  try {
    const registered = await getRegisteredContentScripts();
    if (registered.some((it) => it.id === scriptId)) {
      await unregisterContentScript(scriptId);
    }
    await registerContentScript(entry);
  } catch (error) {
    setStatus(
      `Permission granted, but script registration failed: ${error.message}`,
      "warning",
    );
  }

  try {
    await executeContentScript(currentTab.id);
  } catch {
    setStatus(
      "Domain added, but immediate injection failed on this page",
      "warning",
    );
    return;
  }

  els.dynamicSiteCard.classList.add("hidden");
  setStatus("Chatbot added and features applied instantly", "success");
}

async function setupDynamicSiteCard() {
  currentTab = await queryActiveTab();
  if (!currentTab?.url) {
    els.activeSiteLabel.textContent = "Unavailable";
    els.dynamicSiteCard.classList.add("hidden");
    return;
  }

  currentUrl = currentTab.url;

  let urlObj;
  try {
    urlObj = new URL(currentTab.url);
  } catch {
    els.activeSiteLabel.textContent = "Unsupported URL";
    els.dynamicSiteCard.classList.add("hidden");
    return;
  }

  if (!["http:", "https:"].includes(urlObj.protocol)) {
    els.activeSiteLabel.textContent = "Restricted page";
    els.dynamicSiteCard.classList.add("hidden");
    return;
  }

  const host = urlObj.hostname.toLowerCase();
  currentDomainPattern = `${urlObj.protocol}//${host}/*`;
  els.activeSiteLabel.textContent = host;

  const result = await storageGet(STORAGE_DYNAMIC_SITES_KEY);
  const dynamicPatterns = Array.isArray(result[STORAGE_DYNAMIC_SITES_KEY])
    ? result[STORAGE_DYNAMIC_SITES_KEY]
    : [];
  const supported = isSupportedHost(host, dynamicPatterns);
  const isAi = inferAiHost(urlObj);

  els.dynamicSiteCard.classList.toggle("hidden", supported || !isAi);
}

function activateTab(name) {
  for (const btn of els.tabs) {
    const active = btn.dataset.tab === name;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  }

  for (const [key, panel] of Object.entries(els.panels)) {
    const active = key === name;
    panel.classList.toggle("is-active", active);
    panel.setAttribute("aria-hidden", String(!active));
  }
}

async function handlePromptActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const container = event.target.closest(".prompt-item");
  if (!container) return;

  const id = container.dataset.id;
  const item = promptItems.find((it) => it.id === id);
  if (!item) return;

  const action = button.dataset.action;

  if (action === "inject") {
    await injectPromptToActiveTab(item.content);
    return;
  }

  if (action === "copy") {
    await navigator.clipboard.writeText(item.content);
    setStatus("Prompt copied", "success");
    return;
  }

  if (action === "delete") {
    promptItems = promptItems.filter((it) => it.id !== id);
    await savePrompts();
    renderPromptList();
    setStatus("Prompt removed", "success");
  }
}

async function advancedCopyLatest() {
  if (!currentTab?.id) {
    setStatus("No active tab", "danger");
    return;
  }

  const ready = await ensureContentScriptReady(currentTab.id);
  if (!ready) {
    setStatus("Could not access this page for copy", "danger");
    return;
  }

  try {
    const response = await sendTabMessage(currentTab.id, {
      action: "advancedCopyLatest",
    });
    if (response?.ok) {
      setStatus("Advanced copy completed", "success");
    } else {
      setStatus(response?.error || "Advanced copy failed", "warning");
    }
  } catch (error) {
    setStatus(error.message || "Advanced copy failed", "danger");
  }
}

async function advancedCopyManualText() {
  const text = els.manualCopyInput.value.trim();
  if (!text) {
    setStatus("Manual text is empty", "warning");
    return;
  }

  const plain = normalizeLatexToPlain(text);
  const html = markdownToHtml(plain);

  try {
    await copyDualMime(html, plain);
    setStatus("Manual dual-format copy completed", "success");
  } catch (error) {
    setStatus(error.message || "Copy failed", "danger");
  }
}

function bindEvents() {
  els.tabs.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  els.fontSelect.addEventListener("change", () => {
    els.customFontBox.classList.toggle(
      "hidden",
      els.fontSelect.value !== "custom",
    );
  });

  els.englishFontEnabled.addEventListener("change", () => {
    els.englishFontSelect.disabled = !els.englishFontEnabled.checked;
  });

  els.englishFontSelect.addEventListener("change", () => {
    els.customEnglishFontBox.classList.toggle(
      "hidden",
      els.englishFontSelect.value !== "custom-eng",
    );
  });

  els.fontSizeSlider.addEventListener("input", () => {
    els.fontSizeValue.textContent = `${els.fontSizeSlider.value}px`;
  });

  els.resetBtn.addEventListener("click", async () => {
    currentSettings = { ...DEFAULT_SETTINGS };
    applySettingsToUi();
    await storageSet({ [STORAGE_SETTINGS_KEY]: currentSettings });
    await applySettingsToCurrentTab();
  });

  els.saveApplyBtn.addEventListener("click", applySettingsToCurrentTab);

  els.savePromptBtn.addEventListener("click", savePromptFromForm);
  els.promptSearch.addEventListener("input", renderPromptList);
  els.promptList.addEventListener("click", handlePromptActions);

  els.addChatbotBtn.addEventListener("click", requestAndRegisterDynamicHost);

  els.latexToPlainBtn.addEventListener("click", () => {
    els.latexOutput.value = normalizeLatexToPlain(els.latexInput.value);
    setStatus("Converted LaTeX to plain text", "success");
  });

  els.plainToLatexBtn.addEventListener("click", () => {
    els.latexOutput.value = plainToLatex(els.latexInput.value);
    setStatus("Converted plain text to LaTeX", "success");
  });

  els.copyLatexOutputBtn.addEventListener("click", async () => {
    if (!els.latexOutput.value.trim()) {
      setStatus("Output is empty", "warning");
      return;
    }
    await navigator.clipboard.writeText(els.latexOutput.value);
    setStatus("Output copied", "success");
  });

  els.clearLatexBtn.addEventListener("click", () => {
    els.latexInput.value = "";
    els.latexOutput.value = "";
    setStatus("Converter cleared", "info");
  });

  els.advancedCopyLatestBtn.addEventListener("click", advancedCopyLatest);
  els.advancedCopyManualBtn.addEventListener("click", advancedCopyManualText);
}

async function bootstrap() {
  bindEvents();
  await Promise.all([loadSettings(), loadPrompts()]);
  await setupDynamicSiteCard();
  setStatus("Ready", "info");
}

bootstrap().catch((error) => {
  setStatus(error.message || "Initialization failed", "danger");
});
