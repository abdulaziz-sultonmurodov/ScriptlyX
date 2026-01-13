/**
 * Content Script
 *
 * Responsibilities:
 * - Listen for conversion/translation requests from service worker
 * - Read selected text from the page
 * - Replace selected text with converted/translated text
 * - Handle various input types (input, textarea, contenteditable, text nodes)
 */

import { convert } from "../core/converter";
import {
  MESSAGE_TYPES,
  ConversionType,
  SelectionMessage,
  ConversionResult,
} from "../shared/types";

/**
 * Check if element is an input or textarea
 */
function isTextInputElement(
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "textarea" ||
    (tagName === "input" && isEditableInputType(element as HTMLInputElement))
  );
}

/**
 * Check if input type supports text selection
 */
function isEditableInputType(input: HTMLInputElement): boolean {
  const editableTypes = ["text", "search", "url", "tel", "password", "email"];
  return editableTypes.includes(input.type || "text");
}

/**
 * Check if element is contenteditable
 */
function isContentEditable(element: Element | null): boolean {
  if (!element) return false;

  let current: Element | null = element;
  while (current) {
    if (current instanceof HTMLElement) {
      if (current.isContentEditable) return true;
      if (current.contentEditable === "true") return true;
    }
    current = current.parentElement;
  }

  return false;
}

/**
 * Check if element is read-only
 */
function isReadOnly(element: Element | null): boolean {
  if (!element) return false;

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.readOnly || element.disabled;
  }

  return false;
}

/**
 * Replace text in input or textarea elements
 */
function replaceInTextInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  newText: string
): ConversionResult {
  if (isReadOnly(element)) {
    return { success: false, error: "Element is read-only" };
  }

  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? 0;

  if (start === end) {
    return { success: false, error: "No text selected" };
  }

  try {
    element.setRangeText(newText, start, end, "end");

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: newText,
      })
    );

    element.dispatchEvent(new Event("change", { bubbles: true }));

    return { success: true, converted: newText };
  } catch (error) {
    return { success: false, error: `Failed to replace text: ${error}` };
  }
}

/**
 * Replace text in contenteditable elements
 */
function replaceInContentEditable(
  selection: Selection,
  newText: string
): ConversionResult {
  if (selection.rangeCount === 0) {
    return { success: false, error: "No selection range" };
  }

  try {
    const range = selection.getRangeAt(0);

    range.deleteContents();

    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    const container = range.commonAncestorContainer.parentElement;
    if (container) {
      container.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: newText,
        })
      );
    }

    return { success: true, converted: newText };
  } catch (error) {
    return {
      success: false,
      error: `Failed to replace in contenteditable: ${error}`,
    };
  }
}

/**
 * Replace text in regular DOM text nodes (limited support)
 */
function replaceInTextNode(
  selection: Selection,
  newText: string
): ConversionResult {
  if (selection.rangeCount === 0) {
    return { success: false, error: "No selection range" };
  }

  try {
    const range = selection.getRangeAt(0);

    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    selection.collapseToEnd();

    return { success: true, converted: newText };
  } catch (error) {
    return {
      success: false,
      error: "Cannot modify this element (page may be protected)",
    };
  }
}

/**
 * Replace selected text with new text
 */
function replaceSelection(newText: string): ConversionResult {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return { success: false, error: "No text selected" };
  }

  const activeElement = document.activeElement;

  // Case 1: Input or Textarea
  if (isTextInputElement(activeElement)) {
    return replaceInTextInput(activeElement, newText);
  }

  // Case 2: ContentEditable
  if (isContentEditable(activeElement)) {
    return replaceInContentEditable(selection, newText);
  }

  // Case 3: Check if selection is inside a contenteditable
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const parentElement =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as Element);

  if (isContentEditable(parentElement)) {
    return replaceInContentEditable(selection, newText);
  }

  // Case 4: Regular text node (best effort)
  return replaceInTextNode(selection, newText);
}

/**
 * Handle transliteration conversion
 */
function handleConversion(conversionType: ConversionType): ConversionResult {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return { success: false, error: "No text selected" };
  }

  const selectedText = selection.toString();

  if (!selectedText || selectedText.trim().length === 0) {
    return { success: false, error: "Selection is empty" };
  }

  let convertedText: string;
  try {
    convertedText = convert(selectedText, conversionType);
  } catch (error) {
    return { success: false, error: `Conversion error: ${error}` };
  }

  if (convertedText === selectedText) {
    return { success: true, converted: convertedText };
  }

  return replaceSelection(convertedText);
}

/**
 * Handle translation replacement
 * Note: Translation is done in the background script, we just replace the text here
 */
function handleTranslation(translatedText: string): ConversionResult {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return { success: false, error: "No text selected" };
  }

  if (!translatedText || translatedText.trim().length === 0) {
    return { success: false, error: "Translation is empty" };
  }

  return replaceSelection(translatedText);
}

/**
 * Listen for messages from the service worker
 */
chrome.runtime.onMessage.addListener(
  (
    message: SelectionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ConversionResult) => void
  ) => {
    // Handle transliteration
    if (message.action === MESSAGE_TYPES.CONVERT_SELECTION) {
      const result = handleConversion(message.conversionType);
      sendResponse(result);
      return true;
    }

    // Handle translation replacement
    if (message.action === MESSAGE_TYPES.TRANSLATE_SELECTION) {
      const result = handleTranslation(message.selectedText);
      sendResponse(result);
      return true;
    }

    return false;
  }
);

console.log("ScriptlyX] Content script loaded");
