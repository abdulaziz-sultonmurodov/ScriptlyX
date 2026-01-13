/**
 * Popup Script
 *
 * Handles the extension popup UI:
 * - Settings management
 * - Translation testing
 * - Transliteration testing
 * - Character mapping preview
 */

import { convert } from '../core/converter';
import { translate } from '../core/translator';
import { LATIN_CYRILLIC_MAP } from '../core/mappings/latin-cyrillic';
import { UZBEK_LATIN_CYRILLIC_MAP } from '../core/mappings/uzbek';
import {
  MESSAGE_TYPES,
  UserSettings,
  DEFAULT_SETTINGS,
  Language,
  ConversionType,
} from '../shared/types';

// DOM Elements - Settings
const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
const notificationsCheckbox = document.getElementById('notifications') as HTMLInputElement;

// DOM Elements - Tabs
const tabs = document.querySelectorAll('.tab') as NodeListOf<HTMLButtonElement>;
const tabContents = document.querySelectorAll('.tab-content') as NodeListOf<HTMLDivElement>;

// DOM Elements - Translate Tab
const sourceLangSelect = document.getElementById('source-lang') as HTMLSelectElement;
const targetLangSelect = document.getElementById('target-lang') as HTMLSelectElement;
const translateInput = document.getElementById('translate-input') as HTMLTextAreaElement;
const translateOutput = document.getElementById('translate-output') as HTMLDivElement;
const btnTranslate = document.getElementById('btn-translate') as HTMLButtonElement;

// DOM Elements - Transliterate Tab
const scriptTypeSelect = document.getElementById('script-type') as HTMLSelectElement;
const translitInput = document.getElementById('translit-input') as HTMLTextAreaElement;
const translitOutput = document.getElementById('translit-output') as HTMLDivElement;
const btnTranslit = document.getElementById('btn-translit') as HTMLButtonElement;

// DOM Elements - Mappings
const mappingTabs = document.querySelectorAll('.mapping-tab') as NodeListOf<HTMLButtonElement>;
const mappingGrid = document.getElementById('mapping-grid') as HTMLDivElement;

/**
 * Load settings from storage
 */
async function loadSettings(): Promise<UserSettings> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: MESSAGE_TYPES.GET_SETTINGS },
      (response: UserSettings) => {
        resolve(response || DEFAULT_SETTINGS);
      }
    );
  });
}

/**
 * Save settings to storage
 */
async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await loadSettings();
  const updated = { ...current, ...settings };

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: MESSAGE_TYPES.UPDATE_SETTINGS, settings: updated },
      () => resolve()
    );
  });
}

/**
 * Initialize settings UI
 */
async function initSettings(): Promise<void> {
  const settings = await loadSettings();

  enabledCheckbox.checked = settings.enabled;
  notificationsCheckbox.checked = settings.showNotifications;

  enabledCheckbox.addEventListener('change', () => {
    saveSettings({ enabled: enabledCheckbox.checked });
  });

  notificationsCheckbox.addEventListener('change', () => {
    saveSettings({ showNotifications: notificationsCheckbox.checked });
  });
}

/**
 * Initialize tab switching
 */
function initTabs(): void {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab buttons
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update tab content
      tabContents.forEach((content) => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
}

/**
 * Show output in a container
 */
function showOutput(
  container: HTMLDivElement,
  text: string,
  type: 'success' | 'error' | 'loading' = 'success'
): void {
  container.textContent = text;
  container.classList.add('visible');
  container.classList.remove('error', 'loading');
  if (type === 'error') container.classList.add('error');
  if (type === 'loading') container.classList.add('loading');
}

/**
 * Initialize translation functionality
 */
function initTranslation(): void {
  btnTranslate.addEventListener('click', async () => {
    const input = translateInput.value.trim();
    if (!input) {
      showOutput(translateOutput, 'Enter text to translate', 'error');
      return;
    }

    const sourceLang = sourceLangSelect.value as Language;
    const targetLang = targetLangSelect.value as Language;

    if (sourceLang === targetLang) {
      showOutput(translateOutput, 'Source and target languages must be different', 'error');
      return;
    }

    // Check for Uzbek script conversion (should use transliteration)
    if (
      (sourceLang === 'uz-latn' && targetLang === 'uz-cyrl') ||
      (sourceLang === 'uz-cyrl' && targetLang === 'uz-latn')
    ) {
      showOutput(
        translateOutput,
        'Use Transliterate tab for Uzbek script conversion',
        'error'
      );
      return;
    }

    // Show loading state
    btnTranslate.disabled = true;
    showOutput(translateOutput, 'Translating...', 'loading');

    try {
      const result = await translate(input, sourceLang, targetLang);

      if (result.success && result.translatedText) {
        showOutput(translateOutput, result.translatedText);
      } else {
        showOutput(translateOutput, result.error || 'Translation failed', 'error');
      }
    } catch (error) {
      showOutput(translateOutput, `Error: ${error}`, 'error');
    } finally {
      btnTranslate.disabled = false;
    }
  });
}

/**
 * Initialize transliteration functionality
 */
function initTransliteration(): void {
  btnTranslit.addEventListener('click', () => {
    const input = translitInput.value.trim();
    if (!input) {
      showOutput(translitOutput, 'Enter text to transliterate', 'error');
      return;
    }

    const scriptType = scriptTypeSelect.value as ConversionType;

    try {
      const result = convert(input, scriptType);
      showOutput(translitOutput, result);
    } catch (error) {
      showOutput(translitOutput, `Error: ${error}`, 'error');
    }
  });
}

/**
 * Render character mappings
 */
function renderMappings(type: 'russian' | 'uzbek'): void {
  mappingGrid.innerHTML = '';

  const mappings = type === 'russian' ? LATIN_CYRILLIC_MAP : UZBEK_LATIN_CYRILLIC_MAP;

  // Single character mappings
  const singleCharMappings = mappings.filter(
    (m) => m.latin.length === 1 && m.cyrillic.length === 1
  );

  for (const mapping of singleCharMappings) {
    const item = document.createElement('div');
    item.className = 'mapping-item';
    item.innerHTML = `
      <span class="mapping-latin">${mapping.latin.toUpperCase()}</span>
      <span class="mapping-arrow">↓</span>
      <span class="mapping-cyrillic">${mapping.cyrillic.toUpperCase()}</span>
    `;
    mappingGrid.appendChild(item);
  }

  // Digraphs
  const digraphs = mappings.filter((m) => m.latin.length > 1);

  if (digraphs.length > 0) {
    const separator = document.createElement('div');
    separator.style.gridColumn = '1 / -1';
    separator.style.textAlign = 'center';
    separator.style.fontSize = '11px';
    separator.style.color = '#888';
    separator.style.padding = '8px 0 4px';
    separator.textContent = '— Digraphs —';
    mappingGrid.appendChild(separator);

    for (const mapping of digraphs) {
      const item = document.createElement('div');
      item.className = 'mapping-item';
      item.innerHTML = `
        <span class="mapping-latin">${mapping.latin}</span>
        <span class="mapping-arrow">↓</span>
        <span class="mapping-cyrillic">${mapping.cyrillic}</span>
      `;
      mappingGrid.appendChild(item);
    }
  }
}

/**
 * Initialize mapping preview with tabs
 */
function initMappingPreview(): void {
  // Initial render
  renderMappings('russian');

  // Tab switching
  mappingTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mappingType = tab.dataset.mapping as 'russian' | 'uzbek';

      mappingTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      renderMappings(mappingType);
    });
  });
}

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  await initSettings();
  initTabs();
  initTranslation();
  initTransliteration();
  initMappingPreview();
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
