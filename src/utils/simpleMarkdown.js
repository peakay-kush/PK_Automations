// Removed rich formatting renderer — replaced with a simple passthrough to avoid rich-formatting features.
// If any code still calls this, it will receive plain text (no HTML).
export function simpleMarkdownToHtml(text) {
  return String(text || '');
}
