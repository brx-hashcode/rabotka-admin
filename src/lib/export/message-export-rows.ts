import type { AdminProfileMessage } from "#/lib/api/profiles-controller";

/**
 * One conversation, oldest first, for offline analysis.
 *
 * `Sender` resolves the party rather than leaving the reader to decode
 * `direction`: a spreadsheet of INBOUND/OUTBOUND is unreadable at volume, and
 * the whole point of exporting a chat is to read it somewhere else.
 *
 * `Direction` is kept alongside it anyway — it is what you filter or pivot on
 * to separate what the user said from what we said, which is the first thing
 * anyone analysing support threads does.
 *
 * Must stay index-aligned with both row builders below.
 */
export const MESSAGE_EXPORT_HEADERS = [
  "Sent at (ISO)",
  "Direction",
  "Sender",
  "Channel",
  "Message",
  "Message ID",
] as const;

/**
 * Who actually wrote it.
 *
 * Inbound is always the profile. Outbound carries `sentByName` when an admin
 * sent it by hand and null when the system did — and that distinction matters
 * for analysis, since automated templates would otherwise read as staff replies
 * and inflate any measure of how much support a user received.
 */
function senderOf(
  message: AdminProfileMessage,
  profileName: string,
): string {
  if (message.direction === "INBOUND") return profileName;
  return message.sentByName ?? "System";
}

/**
 * Oldest first — the reading order of a conversation.
 *
 * Sorted here rather than trusting the API's order so the file is stable
 * regardless of how the chat view happens to fetch or paginate.
 */
function chronological(
  messages: AdminProfileMessage[],
): AdminProfileMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function messageItemsToStringRows(
  messages: AdminProfileMessage[],
  profileName: string,
): string[][] {
  return chronological(messages).map((m) => [
    m.createdAt ?? "",
    m.direction ?? "",
    senderOf(m, profileName),
    m.platform ?? "",
    // Left with its newlines intact; the CSV writer quotes and escapes it, and
    // flattening would destroy the shape of anything multi-line.
    m.body ?? "",
    m.id ?? "",
  ]);
}

export function messageItemsToTypedRows(
  messages: AdminProfileMessage[],
  profileName: string,
): (string | number | null)[][] {
  return messageItemsToStringRows(messages, profileName);
}
