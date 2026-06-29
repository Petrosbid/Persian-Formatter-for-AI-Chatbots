(() => {
  if (window.__persianAiToolkitInjected) {
    return;
  }
  window.__persianAiToolkitInjected = true;

  const STORAGE_SETTINGS_KEY = "persianAiToolkitSettings";
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

  const INPUT_SELECTOR = [
    "textarea",
    "[contenteditable='true']",
    "[role='textbox'][contenteditable='true']",
  ].join(",");

  const MESSAGE_SELECTOR = [
    "[data-message-author-role='assistant']",
    "article",
    ".markdown",
    ".prose",
  ].join(",");

  const styleEl = document.createElement("style");
  styleEl.id = "persian-ai-toolkit-style";
  document.documentElement.appendChild(styleEl);

  const vazirFaceHref = chrome.runtime.getURL(
    "vazir-font/Vazirmatn-font-face.css",
  );
  if (!document.querySelector(`link[href='${vazirFaceHref}']`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = vazirFaceHref;
    document.head.appendChild(link);
  }

  let settings = { ...DEFAULT_SETTINGS };

  const persianStrongRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const ltrStrongRegex = /[A-Za-z]/;

  function escapeHtml(input) {
    return String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function injectFontCss(url) {
    if (!url || typeof url !== "string") return;
    if (!document.querySelector(`link[href='${url}']`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }

  function getEffectivePersianFont() {
    if (settings.fontFamily === "custom" && settings.customFont?.name) {
      return settings.customFont.name;
    }
    return settings.fontFamily || "Vazirmatn";
  }

  function getEffectiveEnglishFont() {
    if (!settings.englishFontEnabled) {
      return getEffectivePersianFont();
    }
    if (
      settings.englishFontFamily === "custom-eng" &&
      settings.customEnglishFont?.name
    ) {
      return settings.customEnglishFont.name;
    }
    return settings.englishFontFamily || "Inter";
  }

  function updateGlobalStyle() {
    if (!settings.enabled) {
      styleEl.textContent = "";
      return;
    }

    const persianFont = getEffectivePersianFont();
    const englishFont = getEffectiveEnglishFont();

    styleEl.textContent = `
      .persian-toolkit-assistant-rtl {
        direction: rtl !important;
        text-align: right !important;
        font-family: '${persianFont}', 'Vazirmatn', Tahoma, Arial, sans-serif !important;
        font-size: ${Number(settings.fontSize) || 16}px !important;
      }

      .persian-toolkit-assistant-ltr {
        direction: ltr !important;
        text-align: left !important;
        font-family: '${englishFont}', Inter, Arial, sans-serif !important;
        font-size: ${Number(settings.fontSize) || 16}px !important;
      }

      .persian-advanced-copy-btn {
        position: absolute;
        top: 8px;
        inset-inline-end: 8px;
        z-index: 12;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.72);
        color: #f8fafc;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: transform 180ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), background 180ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .persian-advanced-copy-btn:hover {
        transform: translateY(-1px);
        background: rgba(30, 41, 59, 0.86);
      }

      .persian-advanced-copy-btn:active {
        transform: translateY(0);
      }
    `;
  }

  function textFromInputElement(el) {
    if (!el) return "";
    if (typeof el.value === "string") return el.value;
    return el.innerText || el.textContent || "";
  }

  function detectDirectionByFirstStrongChar(text) {
    if (!text || typeof text !== "string") return "neutral";

    for (const char of text.trimStart()) {
      if (persianStrongRegex.test(char)) return "rtl";
      if (ltrStrongRegex.test(char)) return "ltr";
    }
    return "neutral";
  }

  function applyDirectionToInput(el) {
    if (!settings.enabled || !settings.realtimeInputRtl || !el) return;

    const text = textFromInputElement(el);
    const direction = detectDirectionByFirstStrongChar(text);

    el.setAttribute("dir", "auto");

    if (direction === "rtl") {
      el.style.setProperty("direction", "rtl", "important");
      el.style.setProperty("text-align", "right", "important");
      el.dataset.persianToolkitInputDirection = "rtl";
      return;
    }

    if (direction === "ltr") {
      el.style.setProperty("direction", "ltr", "important");
      el.style.setProperty("text-align", "left", "important");
      el.dataset.persianToolkitInputDirection = "ltr";
      return;
    }

    if (el.dataset.persianToolkitInputDirection) {
      el.style.removeProperty("direction");
      el.style.removeProperty("text-align");
      delete el.dataset.persianToolkitInputDirection;
    }
  }

  function attachInputHandlers(el) {
    if (!el || el.dataset.persianToolkitBound === "1") return;
    el.dataset.persianToolkitBound = "1";

    const handle = () => applyDirectionToInput(el);
    el.addEventListener("input", handle, { passive: true });
    el.addEventListener("keyup", handle, { passive: true });
    el.addEventListener("paste", () => setTimeout(handle, 0), {
      passive: true,
    });

    applyDirectionToInput(el);
  }

  function observeInputs() {
    document.querySelectorAll(INPUT_SELECTOR).forEach(attachInputHandlers);
  }

  function shouldSkipNodeForStyling(node) {
    if (!(node instanceof HTMLElement)) return true;
    if (node.closest("pre, code, kbd, samp")) return true;
    return false;
  }

  function applyTypographyToMessageNode(node) {
    if (!settings.enabled || shouldSkipNodeForStyling(node)) return;

    const text = node.innerText || node.textContent || "";
    if (!text.trim()) return;

    const direction = detectDirectionByFirstStrongChar(text);
    node.classList.remove(
      "persian-toolkit-assistant-rtl",
      "persian-toolkit-assistant-ltr",
    );

    if (direction === "rtl") {
      node.classList.add("persian-toolkit-assistant-rtl");
    } else {
      node.classList.add("persian-toolkit-assistant-ltr");
    }
  }

  function processAssistantNodes() {
    document.querySelectorAll(MESSAGE_SELECTOR).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const text = node.innerText || node.textContent || "";
      if (text.trim().length < 24) return;
      applyTypographyToMessageNode(node);
    });
  }

  function visibleElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 16) return false;
    const styles = getComputedStyle(el);
    return styles.visibility !== "hidden" && styles.display !== "none";
  }

  function findBestInputTarget() {
    const candidates = Array.from(document.querySelectorAll(INPUT_SELECTOR))
      .filter((el) => el instanceof HTMLElement)
      .filter(visibleElement)
      .filter((el) => {
        if (
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLInputElement
        ) {
          return !el.disabled && !el.readOnly;
        }
        return true;
      });

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return br.width * br.height - ar.width * ar.height;
    });

    return candidates[0];
  }

  function insertTextInEditable(target, text) {
    if (!target) return false;

    if (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLInputElement
    ) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const value = target.value;
      target.value = `${value.slice(0, start)}${text}${value.slice(end)}`;
      const nextPos = start + text.length;
      target.selectionStart = nextPos;
      target.selectionEnd = nextPos;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      target.focus();
      applyDirectionToInput(target);
      return true;
    }

    if (target instanceof HTMLElement && target.isContentEditable) {
      target.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!target.contains(range.commonAncestorContainer)) {
          const freshRange = document.createRange();
          freshRange.selectNodeContents(target);
          freshRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(freshRange);
        }
      }

      const ok = document.execCommand("insertText", false, text);
      if (!ok) {
        target.textContent = (target.textContent || "") + text;
      }

      target.dispatchEvent(new Event("input", { bubbles: true }));
      applyDirectionToInput(target);
      return true;
    }

    return false;
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

  function markdownFromNode(node, depth = 0) {
    if (!node) return "";

    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes)
      .map((n) => markdownFromNode(n, depth + 1))
      .join("");

    if (tag === "br") return "\n";
    if (tag === "h1") return `# ${children.trim()}\n\n`;
    if (tag === "h2") return `## ${children.trim()}\n\n`;
    if (tag === "h3") return `### ${children.trim()}\n\n`;
    if (tag === "strong" || tag === "b") return `**${children.trim()}**`;
    if (tag === "em" || tag === "i") return `*${children.trim()}*`;
    if (tag === "code" && !el.closest("pre")) return `\`${children.trim()}\``;

    if (tag === "pre") {
      const code = el.textContent || "";
      return `\n\`\`\`\n${code.trim()}\n\`\`\`\n\n`;
    }

    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      return `[${children.trim()}](${href})`;
    }

    if (tag === "li") {
      return `- ${children.trim()}\n`;
    }

    if (tag === "ul" || tag === "ol") {
      return `${children}\n`;
    }

    if (["p", "div", "section", "article", "blockquote"].includes(tag)) {
      const trimmed = children.trim();
      return trimmed ? `${trimmed}\n\n` : "";
    }

    return children;
  }

  function applyInlineStylesForCopy(root) {
    const rtlBlockTags = new Set([
      "DIV",
      "P",
      "SECTION",
      "ARTICLE",
      "LI",
      "UL",
      "OL",
      "BLOCKQUOTE",
    ]);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let current = walker.nextNode();
    while (current) {
      if (current instanceof HTMLElement) {
        const tag = current.tagName;

        if (rtlBlockTags.has(tag)) {
          current.setAttribute("dir", "rtl");
          current.style.direction = "rtl";
          current.style.textAlign = "right";
        }

        if (tag === "H1") {
          current.style.fontSize = "28px";
          current.style.fontWeight = "700";
          current.style.margin = "12px 0";
        } else if (tag === "H2") {
          current.style.fontSize = "24px";
          current.style.fontWeight = "700";
          current.style.margin = "10px 0";
        } else if (tag === "H3") {
          current.style.fontSize = "20px";
          current.style.fontWeight = "700";
          current.style.margin = "8px 0";
        } else if (tag === "P") {
          current.style.margin = "8px 0";
          current.style.lineHeight = "1.8";
        } else if (tag === "CODE") {
          current.style.fontFamily = "'Cascadia Code', Consolas, monospace";
          current.style.background = "#f1f5f9";
          current.style.padding = "2px 6px";
          current.style.borderRadius = "6px";
        } else if (tag === "PRE") {
          current.style.fontFamily = "'Cascadia Code', Consolas, monospace";
          current.style.background = "#f8fafc";
          current.style.border = "1px solid #e2e8f0";
          current.style.padding = "12px";
          current.style.borderRadius = "8px";
          current.style.overflowX = "auto";
          current.style.textAlign = "left";
          current.style.direction = "ltr";
          current.removeAttribute("dir");
        }
      }
      current = walker.nextNode();
    }
  }

  function buildAdvancedClipboardPayloadFromNode(node) {
    const cloned = node.cloneNode(true);
    if (!(cloned instanceof HTMLElement)) {
      const plain = normalizeLatexToPlain(node.textContent || "");
      return {
        html: `<div dir='rtl' style='direction:rtl;text-align:right;font-family:Vazirmatn, Tahoma, sans-serif;'>${escapeHtml(plain)}</div>`,
        markdown: plain,
      };
    }

    cloned
      .querySelectorAll("button, svg, script, style")
      .forEach((n) => n.remove());
    applyInlineStylesForCopy(cloned);

    const font = escapeHtml(getEffectivePersianFont());
    const wrappedHtml = `
      <div dir="rtl" style="direction:rtl;text-align:right;font-family:'${font}','Vazirmatn',Tahoma,Arial,sans-serif;line-height:1.9;color:#0f172a;">
        ${cloned.innerHTML}
      </div>
    `.trim();

    const markdown = normalizeLatexToPlain(markdownFromNode(cloned).trim());
    return { html: wrappedHtml, markdown };
  }

  async function clipboardWriteDual(html, plain) {
    if (navigator.clipboard && typeof window.ClipboardItem === "function") {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }

    const listener = (event) => {
      event.preventDefault();
      event.clipboardData?.setData("text/html", html);
      event.clipboardData?.setData("text/plain", plain);
    };

    document.addEventListener("copy", listener, { once: true });
    const ok = document.execCommand("copy");
    if (!ok) {
      throw new Error("Clipboard write failed");
    }
  }

  function findAssistantMessageCandidates() {
    return Array.from(document.querySelectorAll(MESSAGE_SELECTOR))
      .filter((el) => el instanceof HTMLElement)
      .filter(visibleElement)
      .filter((el) => (el.innerText || el.textContent || "").trim().length > 40)
      .filter((el) => !el.closest("pre, code"));
  }

  function findLatestAssistantMessage() {
    const candidates = findAssistantMessageCandidates();
    return candidates.length ? candidates[candidates.length - 1] : null;
  }

  async function copyAdvancedFromNode(node) {
    if (!node) {
      throw new Error("No message found to copy");
    }
    const payload = buildAdvancedClipboardPayloadFromNode(node);
    await clipboardWriteDual(payload.html, payload.markdown);
    return payload;
  }

  function ensureCopyButtons() {
    const candidates = findAssistantMessageCandidates();
    for (const node of candidates) {
      if (node.dataset.persianToolkitCopyBound === "1") continue;
      node.dataset.persianToolkitCopyBound = "1";

      const existingPosition = getComputedStyle(node).position;
      if (existingPosition === "static") {
        node.style.position = "relative";
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "persian-advanced-copy-btn";
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Advanced Copy</span>
      `;

      btn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const original = btn.innerHTML;
        try {
          await copyAdvancedFromNode(node);
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
            <span>Copied</span>
          `;
        } catch {
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Failed</span>
          `;
        }
        setTimeout(() => {
          btn.innerHTML = original;
        }, 1400);
      });

      node.appendChild(btn);
    }
  }

  function refreshAllFeatures() {
    observeInputs();
    processAssistantNodes();
    ensureCopyButtons();
  }

  async function loadSettings() {
    const result = await chrome.storage.sync.get(STORAGE_SETTINGS_KEY);
    settings = { ...DEFAULT_SETTINGS, ...(result[STORAGE_SETTINGS_KEY] || {}) };

    if (settings.customFont?.url) injectFontCss(settings.customFont.url);
    if (settings.englishFontEnabled && settings.customEnglishFont?.url) {
      injectFontCss(settings.customEnglishFont.url);
    }

    updateGlobalStyle();
    refreshAllFeatures();
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    if (!changes[STORAGE_SETTINGS_KEY]) return;

    settings = {
      ...DEFAULT_SETTINGS,
      ...(changes[STORAGE_SETTINGS_KEY].newValue || {}),
    };

    if (settings.customFont?.url) injectFontCss(settings.customFont.url);
    if (settings.englishFontEnabled && settings.customEnglishFont?.url) {
      injectFontCss(settings.customEnglishFont.url);
    }

    updateGlobalStyle();
    refreshAllFeatures();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      if (!message || typeof message !== "object") {
        sendResponse({ ok: false, error: "Invalid message" });
        return;
      }

      if (message.action === "ping") {
        sendResponse({ ok: true });
        return;
      }

      if (message.action === "updateSettings") {
        settings = { ...DEFAULT_SETTINGS, ...(message.settings || {}) };
        if (settings.customFont?.url) injectFontCss(settings.customFont.url);
        if (settings.englishFontEnabled && settings.customEnglishFont?.url) {
          injectFontCss(settings.customEnglishFont.url);
        }
        updateGlobalStyle();
        refreshAllFeatures();
        sendResponse({ ok: true });
        return;
      }

      if (message.action === "injectPrompt") {
        const text = String(message.text || "");
        if (!text.trim()) {
          sendResponse({ ok: false, error: "Prompt is empty" });
          return;
        }

        const target = findBestInputTarget();
        if (!target) {
          sendResponse({ ok: false, error: "No editable input found" });
          return;
        }

        const done = insertTextInEditable(target, text);
        sendResponse({
          ok: done,
          error: done ? undefined : "Failed to insert text",
        });
        return;
      }

      if (message.action === "advancedCopyLatest") {
        const node = findLatestAssistantMessage();
        if (!node) {
          sendResponse({ ok: false, error: "No assistant response found" });
          return;
        }

        await copyAdvancedFromNode(node);
        sendResponse({ ok: true });
        return;
      }

      sendResponse({ ok: false, error: "Unknown action" });
    })().catch((error) => {
      sendResponse({ ok: false, error: error?.message || "Unexpected error" });
    });

    return true;
  });

  const observer = new MutationObserver(() => {
    refreshAllFeatures();
  });

  function startObservers() {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  loadSettings().finally(() => {
    startObservers();
  });
})();
