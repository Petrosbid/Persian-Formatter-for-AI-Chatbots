<div align="center">

# 🌟 Persian Formatter for AI Chatbots 
### افزونه تنظیم خودکار راست‌چین برای فارسی در چت‌بات‌ها

[![Version](https://img.shields.io/badge/version-1.1-blue.svg?style=for-the-badge&logo=google-chrome)](https://github.com/yourusername/persian-formatter)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-success.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Read in:** [🇮🇷 فارسی](#-توضیحات-فارسی) | [🇺🇸 English](#-english-description)

<br/>
<p>
  A powerful Chrome extension that seamlessly forces RTL direction and beautiful Persian typography for AI Chatbots.
  <br>
  اکستنشن قدرتمند کروم برای اصلاح بهم‌ریختگی متن‌های فارسی، تنظیم راست‌چین (RTL) و اعمال فونت‌های زیبای فارسی در چت‌بات‌های هوش مصنوعی.
</p>

</div>

---

## 🇮🇷 توضیحات فارسی

خسته شدید از اینکه متن‌های فارسی توی **ChatGPT** یا **Claude** به هم ریخته و چپ‌چین نمایش داده میشن؟ افزونه **Persian Formatter** با تشخیص خودکار متون فارسی (RTL)، تجربه گفتگوی شما با هوش مصنوعی را بی‌نقص می‌کند. 

این افزونه بدون اینکه کدهای برنامه‌نویسی را به هم بریزد، متون فارسی را راست‌چین کرده و با فونت و سایز دلخواه شما به نمایش درمی‌آورد.

### ✨ ویژگی‌های کلیدی (Features)

* **🌐 راست‌چین‌سازی هوشمند:** تشخیص خودکار حروف فارسی و اعمال `direction: rtl` فقط برای متن‌های فارسی.
* **🛡️ محافظت از بلوک‌های کد (Code-Block Safe):** عدم تداخل با کدهای برنامه‌نویسی. کدهای شما کاملاً چپ‌چین و مرتب باقی می‌مانند!
* **🎨 تایپوگرافی زیبا و سفارشی:** دارای فونت‌های پیش‌فرض (وزیر، ساحل، ایران‌سنس، تاهوما) و قابلیت افزودن **فونت سفارشی** با استفاده از آدرس CSS.
* **🔤 فونت مجزا برای انگلیسی:** امکان تنظیم فونت جداگانه و اختصاصی برای کلمات انگلیسی موجود در متن.
* **📏 تنظیم آنی سایز (Real-time):** تغییر سایز متن با استفاده از یک اسلایدر روان بدون نیاز به رفرش صفحه.
* **⚡ بسیار سبک و بهینه:** نوشته شده با جاوااسکریپت خالص (Vanilla JS) بدون افت سرعت مرورگر.

### 🤖 چت‌بات‌های پشتیبانی‌شده (Supported Platforms)

این افزونه در حال حاضر از محبوب‌ترین ابزارهای هوش مصنوعی پشتیبانی می‌کند:

| پلتفرم | وضعیت پشتیبانی | آدرس وب‌سایت |
| :--- | :---: | :--- |
| **ChatGPT** | ✅ | `chatgpt.com` / `chat.openai.com` |
| **Claude AI** | ✅ | `claude.ai` |
| **Google Gemini** | ✅ | `gemini.google.com` |
| **DeepSeek** | ✅ | `chat.deepseek.com` |
| **GitHub Copilot** | ✅ | `github.com/copilot` |
| **Poe** | ✅ | `poe.com` |

### 🛠️ آموزش نصب (Installation)

از آنجایی که این افزونه هنوز در Chrome Web Store منتشر نشده است، می‌توانید آن را به صورت دستی (Unpacked) نصب کنید:

1. ابتدا این مخزن را دانلود کرده (Download ZIP) و در یک پوشه اکسترکت کنید.
2. مرورگر کروم را باز کنید و به آدرس `chrome://extensions/` بروید.
3. در گوشه بالا سمت راست، گزینه **Developer mode** را فعال کنید.
4. روی دکمه **Load unpacked** کلیک کنید.
5. پوشه‌ای که فایل‌های افزونه (شامل `manifest.json`) در آن قرار دارد را انتخاب کنید.
6. تمام! حالا می‌توانید وارد یکی از چت‌بات‌ها شوید و از روی نوار افزونه‌ها، تغییرات دلخواه را اعمال کنید.

---

## 🇺🇸 English Description

Are you tired of messy, left-aligned Persian/Arabic text in **ChatGPT** or **Claude**? The **Persian Formatter** Chrome extension intelligently detects RTL languages and beautifully formats them, greatly improving your reading experience with AI chatbots.

It applies Right-to-Left (RTL) alignment and custom web fonts to Persian text while strictly protecting your code blocks!

### ✨ Key Features

* **🌐 Smart RTL Detection:** Automatically detects Persian characters and seamlessly applies RTL direction.
* **🛡️ Code-Block Safe:** Intelligently skips `<pre>`, `<code>`, and markdown code blocks. Your code remains LTR and perfectly structured!
* **🎨 Custom Web Fonts:** Choose from beautiful bundled fonts (Vazir, Sahel, IranSans, Tahoma) or inject your own **Custom CSS Font URL**.
* **🔤 Separate English Font:** Apply a completely distinct font (e.g., Courier New, Roboto) specifically for English text and code elements.
* **📏 Real-Time Resizing:** Easily scale font sizes up or down using an interactive slider.
* **⚡ Lightweight & Fast:** Built with vanilla JavaScript via MutationObserver to format dynamically streaming text without performance drops.

### 🤖 Supported Chatbots

| Platform | Status | URL |
| :--- | :---: | :--- |
| **ChatGPT** | ✅ | `chatgpt.com` / `chat.openai.com` |
| **Claude AI** | ✅ | `claude.ai` |
| **Google Gemini** | ✅ | `gemini.google.com` |
| **DeepSeek** | ✅ | `chat.deepseek.com` |
| **GitHub Copilot** | ✅ | `github.com/copilot` |
| **Poe** | ✅ | `poe.com` |

### 🛠️ How to Install (Developer Mode)

To install this extension locally on Google Chrome or Edge:

1. Clone or **Download ZIP** this repository and extract it to a folder.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle switch in the top right corner).
4. Click on the **Load unpacked** button.
5. Select the extracted folder (the one containing `manifest.json`).
6. You're all set! Pin the extension to your toolbar, visit any supported chatbot, and tweak the settings to your liking.

---

## 💻 Tech Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript
* **Manifest:** Manifest V3
* **Storage:** Chrome Sync Storage API
* **DOM Manipulation:** MutationObserver API (for streaming responses)

## 🤝 مشارکت (Contributing)
خوشحال می‌شویم اگر در توسعه این افزونه مشارکت کنید! اگر باگ پیدا کردید یا ایده جدیدی دارید، لطفاً یک **Issue** باز کنید یا **Pull Request** بفرستید.
<br>
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📜 لایسنس (License)
این پروژه تحت لایسنس [MIT](https://opensource.org/licenses/MIT) منتشر شده است. استفاده، تغییر و توزیع آن برای همه آزاد است.
