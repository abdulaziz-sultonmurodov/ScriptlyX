# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build        # Build for production (minified)
npm run watch        # Development mode with auto-rebuild
npm run package      # Build and create ZIP for Chrome Web Store
npm run icons        # Generate placeholder icons
npm run clean        # Remove build and dist directories
```

## Loading the Extension in Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

## Architecture

This is a Chrome Extension (Manifest V3) for text translation and transliteration between English, Russian, and Uzbek.

### Entry Points

The extension has three bundled entry points (built by esbuild):

- **Service Worker** (`src/background/service-worker.ts` → `build/background/service-worker.js`): Creates context menus, handles menu clicks, performs translations via APIs, routes messages to content scripts
- **Content Script** (`src/content/content-script.ts` → `build/content/content-script.js`): Injected into all pages, handles text selection replacement in DOM (inputs, textareas, contenteditable, text nodes)
- **Popup** (`src/popup/popup.ts` → `build/popup/popup.js`): Extension popup UI for testing translations and managing settings

### Core Modules

- **`src/core/converter.ts`**: Pluggable converter registry for transliteration. Registers converters at module load time.
- **`src/core/translator.ts`**: Translation service with API fallback chain (Google Translate unofficial → MyMemory → LibreTranslate)
- **`src/core/mappings/`**: Character mapping tables for Russian and Uzbek Latin↔Cyrillic conversion. Uses greedy matching (longest sequences first).

### Message Flow

1. User right-clicks selected text → context menu appears
2. Service worker handles `contextMenus.onClicked`
3. For transliteration: sends `CONVERT_SELECTION` message to content script
4. For translation: service worker calls translation APIs, then sends `TRANSLATE_SELECTION` with result
5. Content script replaces selected text in-place and dispatches input events for framework compatibility

### Types

All shared types are in `src/shared/types.ts`:
- `Language`: `'en' | 'ru' | 'uz-latn' | 'uz-cyrl'`
- `ConversionType`: transliteration action identifiers
- Message interfaces for service worker ↔ content script communication
- `UserSettings` for chrome.storage.sync

### Build Configuration

- esbuild bundles TypeScript with different formats per entry point:
  - Service worker: ESM (`format: 'esm'`)
  - Content script: IIFE (`format: 'iife'`) - required for injection
  - Popup: ESM
- Target: Chrome 100+
- TypeScript strict mode enabled
