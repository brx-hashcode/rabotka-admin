/**
 * Who a message in a profile's Messages panel is shown as coming from.
 *
 * An outbound message carries a sender only when an admin wrote it by hand
 * (`sent_by_id`). Everything else — the bot's menus, VoVa's answers,
 * notifications — has none. This used to fall back to the name of whoever was
 * signed in, so every automatic reply read as written by the admin looking at
 * the page, a different author for every viewer. It now says what it is.
 */
export const AUTOMATIC_SENDER_LABEL = "Rabotka";

export function messageSenderLabel(
  message: Readonly<{ direction: string; sentByName: string | null }>,
  profileName: string,
): string {
  if (message.direction !== "OUTBOUND") return profileName;
  return message.sentByName?.trim() || AUTOMATIC_SENDER_LABEL;
}
