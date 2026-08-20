/**
 * Mirror of the backend's template-variable flattening.
 *
 * SOURCE OF TRUTH:
 *   rabotka-backend/src/common/utils/whatsapp-template-text.util.ts
 *
 * Duplicated here for one reason only: the composer shows a live character count
 * against the same limit the backend enforces, and counting the raw textarea
 * value would disagree with it — a message with several paragraphs grows by two
 * characters per break once flattened. The backend's 400 is still the real
 * guard; this only stops the admin walking into it.
 *
 * Keep the two in step. If the flattening rule changes there, change it here.
 */

/**
 * Meta rejects newlines, tabs and runs of 4+ spaces inside a template variable,
 * so a multi-line admin message is collapsed onto one line. Paragraph breaks
 * become a visible `·` so the structure survives the squash.
 */
export function flattenForTemplateVariable(text: string): string {
  const flattened = text
    .trim()
    .replace(/\r\n?/g, "\n")
    .replace(/[\p{Cc}\p{Cf}]/gu, (c) => (c === "\n" || c === "\t" ? c : ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, " · ")
    .replace(/\n/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();

  return /^[·\s]*$/.test(flattened) ? "" : flattened;
}

/** Matches ADMIN_MESSAGE_VAR_MAX on the backend. */
export const ADMIN_MESSAGE_VAR_MAX = 700;
