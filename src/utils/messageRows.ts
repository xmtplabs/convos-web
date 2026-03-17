import {
  isGroupUpdated,
  isReaction,
  type BuiltInContentTypes,
  type DecodedMessage,
  type GroupUpdated,
} from "@xmtp/browser-sdk";
import { isExplodeSettings } from "@/utils/explode";
import { formatTimeLabel, getMinuteKey } from "@/utils/time";
import { getGroupUpdatedStrings } from "@/utils/xmtp";

export type SummaryRow = {
  type: "summary";
};

export type TimeRow = {
  type: "time";
  label: string;
  key: string;
};

export type MessageRow = {
  type: "message";
  message: DecodedMessage<BuiltInContentTypes>;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

export type Row = SummaryRow | TimeRow | MessageRow;

export const buildRows = (
  messages: DecodedMessage<BuiltInContentTypes>[],
  inboxId: string,
  expiresAtUnix?: number,
): { rows: Row[]; messageIdToIndex: Map<string, number> } => {
  const rows: Row[] = [];
  const messageIdToIndex = new Map<string, number>();
  let lastMinuteKey = "";

  // pre-scan: find the last group update with unrecognized metadata changes
  // (the one that set the explode timer) so we only show one notification
  let explodeMessageId: string | null = null;
  if (expiresAtUnix != null) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (isGroupUpdated(msg)) {
        const gu = msg.content as GroupUpdated;
        const lines = getGroupUpdatedStrings(gu);
        if (gu.metadataFieldChanges.length > lines.length) {
          explodeMessageId = msg.id;
          break;
        }
      }
    }
  }

  rows.push({
    type: "summary",
  });

  for (const message of messages) {
    if (isReaction(message) || isExplodeSettings(message)) {
      continue;
    }
    if (isGroupUpdated(message)) {
      const gu = message.content as GroupUpdated;
      const lines = getGroupUpdatedStrings(gu);
      if (lines.length === 0 && message.id !== explodeMessageId) {
        continue;
      }
    }

    const minuteKey = getMinuteKey(message.sentAtNs);
    if (minuteKey !== lastMinuteKey) {
      const ms = Number(message.sentAtNs / 1_000_000n);
      rows.push({
        type: "time",
        label: formatTimeLabel(new Date(ms)),
        key: `time-${minuteKey}`,
      });
      lastMinuteKey = minuteKey;
    }
    messageIdToIndex.set(message.id, rows.length);
    rows.push({
      type: "message",
      message,
      isOwn: message.senderInboxId === inboxId,
      isFirstInGroup: false,
      isLastInGroup: false,
    });
  }

  // compute isFirstInGroup / isLastInGroup based on adjacent rows.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.type !== "message") {
      continue;
    }
    const prev = rows[i - 1] as Row | undefined;
    const next = rows[i + 1] as Row | undefined;
    row.isFirstInGroup =
      !prev ||
      prev.type === "time" ||
      prev.type === "summary" ||
      prev.message.senderInboxId !== row.message.senderInboxId;
    row.isLastInGroup =
      !next ||
      next.type === "time" ||
      next.type === "summary" ||
      next.message.senderInboxId !== row.message.senderInboxId;
  }

  return { rows, messageIdToIndex };
};

export const getRowKey = (row: Row): string => {
  switch (row.type) {
    case "summary":
      return "summary";
    case "time":
      return row.key;
    case "message":
      return row.message.id;
  }
};
