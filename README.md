# Promptly AI 🚀

**Promptly AI** is a Chrome extension that transforms prompt engineering into a one-click process, helping you get optimized, professional prompts for ChatGPT, Claude, and Perplexity. It is ideal for content creators, researchers, and anyone seeking clearer, more effective AI responses.

---

## 🌟 Features
- **One-Click Enhancement**: Instantly refines and clarifies your prompts for maximum response quality.
- **Multi-Platform Support**: Works seamlessly with ChatGPT, Claude, and Perplexity web interfaces.
- **JSON & Text Output**: Choose between plain text or structured JSON prompt enhancement.
- **Side Panel for Saved Prompts**: Save, manage, and reuse up to 5 custom prompts.
- **Keyboard Shortcuts**: Quickly enhance prompts with `Ctrl + M` (Windows/Linux) or `⌘ + M` (Mac).
- **Theme Toggle**: Switch between light and dark mode in the popup.
- **Modern UI**: Clean, responsive popup and side panel with intuitive controls.

---

## 📦 Code Structure

```
src/
  ├── favicon-16x16.png, favicon-32x32.png         # Extension icons
  ├── images/                                      # Additional icons
  ├── index.html                                   # Usage instructions
  ├── popup.html                                   # Main extension popup
  ├── sidepanel.html                               # Side panel for saved prompts
  ├── styles/popup.css                             # Shared styles
  ├── scripts/
  │     ├── background.js                          # Background service worker/API relay
  │     ├── config.js                              # API endpoints and keys
  │     ├── gpt-content.js                         # Content script for ChatGPT
  │     ├── claude-content.js                      # Content script for Claude
  │     ├── perplexity-content.js                  # Content script for Perplexity
  │     ├── popup.js                               # Popup UI logic
  │     └── sidepanel.js                           # Side panel logic
  ├── lambda_handler.py                            # (Serverless) API for prompt enhancement
  ├── manifest.json                                # Chrome extension manifest
```

---

## 🚀 Usage

1. Open ChatGPT in your browser.
2. Type your question or prompt as usual.
3. Click the <strong>Enhance Prompt</strong> button (appears next to the send button) or use the keyboard shortcut (`Ctrl + M` or `⌘ + M`).
4. Optionally, toggle JSON format for structured output.
5. Use the popup to access settings, theme toggle, and open the side panel for saved prompts.
6. In the side panel, save up to 5 custom prompts for quick reuse.

---

## 🛠️ How It Works

- **Content Scripts** inject an "Enhance Prompt" button into supported AI chat sites. When clicked, your prompt is sent to a serverless API (see `lambda_handler.py`) that rewrites it for clarity, structure, and professionalism—never answering the prompt, only improving it.
- **Popup & Side Panel** provide quick access to features, theme, and prompt management.
- **Background Script** relays API requests and manages configuration.

---

## 🧩 Supported Sites
- [x] ChatGPT (chat.openai.com, chatgpt.com)

---

