<p align="center">
  <img src="assets/icons/icon-128.png" alt="ScriptlyX Logo" width="128" height="128">
</p>

# ScriptlyX

A Chrome extension for translating and transliterating text between English, Russian, and Uzbek. Right-click any selected text to convert Latin ↔ Cyrillic instantly.

## Features

- **Translation** between English, Russian, and Uzbek (Latin & Cyrillic)
- **Transliteration** for Russian and Uzbek scripts (Latin ↔ Cyrillic)
- **Right-click context menu** for quick access
- **In-place text replacement** - no copy-paste needed
- **Quick Translate** with automatic language detection (EN ↔ RU)
- **Offline transliteration** - script conversion works without internet
- **Privacy-focused** - no data collection or tracking

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked" and select the project folder

## Usage

1. Select any text on a webpage
2. Right-click to open the context menu
3. Choose **ScriptlyX** → **Translate** or **Transliterate**
4. Text is instantly replaced

You can also click the extension icon to:
- Test translations in the popup
- Convert text between scripts
- View character mapping tables

## Supported Languages

| Language | Code | Script |
|----------|------|--------|
| English | en | Latin |
| Russian | ru | Cyrillic |
| Uzbek (Latin) | uz-latn | Latin |
| Uzbek (Cyrillic) | uz-cyrl | Cyrillic |

## Transliteration Examples

**Russian:**
- `privet` → `привет`
- `spasibo` → `спасибо`

**Uzbek:**
- `salom` → `салом`
- `rahmat` → `рахмат`

## Development

```bash
npm run build    # Build for production
npm run watch    # Development mode with auto-rebuild
npm run package  # Create ZIP for Chrome Web Store
npm run clean    # Remove build artifacts
```

## Project Structure

```
src/
├── background/     # Service worker (context menus, message routing)
├── content/        # Content script (text replacement in pages)
├── core/           # Conversion engine and translation service
│   └── mappings/   # Character mapping tables (Russian, Uzbek)
├── popup/          # Extension popup UI
└── shared/         # Shared types and constants
```

## Privacy

- Transliteration works 100% offline
- Translation uses third-party APIs (Google Translate, MyMemory)
- No personal data is collected or stored
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details

## License

MIT
