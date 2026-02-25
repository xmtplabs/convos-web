import { Avatar, Box, Text } from "@mantine/core";
import {
  isGroupUpdated,
  isReaction,
  isRemoteAttachment,
  isTextReply,
  ReactionAction,
  type BuiltInContentTypes,
  type DecodedMessage,
  type GroupUpdated,
  type Reaction,
} from "@xmtp/browser-sdk";
import { ReplyIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import VirtualList, {
  type VirtualListHandle,
} from "@/components/shared/VirtualList";
import type { Convo } from "@/db";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { getContentString, getGroupUpdatedStrings } from "@/utils/xmtp";
import { MessageActions } from "./MessageActions";
import classes from "./MessageList.module.css";
import { ReactionBar, type ReactionEntry } from "./ReactionBar";
import { RemoteAttachmentContent } from "./RemoteAttachmentContent";

type SummaryRow = {
  type: "summary";
};

type TimeRow = {
  type: "time";
  label: string;
  key: string;
};

type MessageRow = {
  type: "message";
  message: DecodedMessage<BuiltInContentTypes>;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

type Row = SummaryRow | TimeRow | MessageRow;

type ReactionMap = Map<string, Map<string, ReactionEntry>>;

const formatTimeLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${time}`;
  }

  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
  return `${dateStr}, ${time}`;
};

const getMinuteKey = (sentAtNs: bigint): string => {
  const ms = Number(sentAtNs / 1_000_000n);
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
};

const addReaction = (
  map: ReactionMap,
  reference: string,
  reaction: Reaction,
  senderInboxId: string,
  inboxId: string,
) => {
  if (!reaction.content) {
    return;
  }

  let msgReactions = map.get(reference);
  if (!msgReactions) {
    msgReactions = new Map();
    map.set(reference, msgReactions);
  }

  const existing = msgReactions.get(reaction.content);

  if (reaction.action === ReactionAction.Added) {
    if (existing) {
      existing.count += 1;
      if (senderInboxId === inboxId) {
        existing.reacted = true;
      }
    } else {
      msgReactions.set(reaction.content, {
        emoji: reaction.content,
        count: 1,
        reacted: senderInboxId === inboxId,
      });
    }
  } else if (reaction.action === ReactionAction.Removed && existing) {
    existing.count -= 1;
    if (senderInboxId === inboxId) {
      existing.reacted = false;
    }
    if (existing.count <= 0) {
      msgReactions.delete(reaction.content);
    }
  }
};

const buildReactionMap = (
  messages: DecodedMessage<BuiltInContentTypes>[],
  inboxId: string,
): ReactionMap => {
  const map: ReactionMap = new Map();

  for (const msg of messages) {
    // Process reactions embedded on each message (from initial fetch)
    if (!isReaction(msg) && msg.reactions.length > 0) {
      for (const r of msg.reactions) {
        const reaction = r.content as Reaction;
        if (reaction.reference) {
          addReaction(
            map,
            reaction.reference,
            reaction,
            r.senderInboxId,
            inboxId,
          );
        }
      }
    }

    // Process standalone reaction messages (from streaming)
    if (isReaction(msg)) {
      const reaction = msg.content as Reaction;
      if (reaction.reference) {
        addReaction(
          map,
          reaction.reference,
          reaction,
          msg.senderInboxId,
          inboxId,
        );
      }
    }
  }

  return map;
};

const buildRows = (
  messages: DecodedMessage<BuiltInContentTypes>[],
  inboxId: string,
): { rows: Row[]; messageIdToIndex: Map<string, number> } => {
  const rows: Row[] = [];
  const messageIdToIndex = new Map<string, number>();
  let lastMinuteKey = "";

  rows.push({
    type: "summary",
  });

  for (const message of messages) {
    if (isReaction(message)) {
      continue;
    }
    if (
      isGroupUpdated(message) &&
      getGroupUpdatedStrings(message.content as GroupUpdated).length === 0
    ) {
      continue;
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

  // Compute isFirstInGroup / isLastInGroup based on adjacent rows.
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

const getRowKey = (row: Row): string => {
  switch (row.type) {
    case "summary":
      return "summary";
    case "time":
      return row.key;
    case "message":
      return row.message.id;
  }
};

const AvatarImg: React.FC<{ inboxId: string }> = ({ inboxId }) => {
  const { convo, memberProfiles } = useConvo();
  const src = useAvatar(convo.id, inboxId);
  const name = memberProfiles.get(inboxId)?.name;
  return (
    <Avatar size={28} radius="xl" src={src}>
      {!src && (name ? name[0].toUpperCase() : "S")}
    </Avatar>
  );
};

const RowRenderer = ({
  row,
  reactionMap,
  onScrollToMessage,
  highlightedMessageId,
  convo,
}: {
  row: Row;
  reactionMap: ReactionMap;
  onScrollToMessage: (messageId: string) => void;
  highlightedMessageId: string | null;
  convo: Convo;
}) => {
  const { memberProfiles } = useConvo();
  if (row.type === "time") {
    return (
      <div className={`${classes.item} ${classes.timeLabel}`}>
        <Text size="xs" c="dimmed">
          {row.label}
        </Text>
      </div>
    );
  }

  if (row.type === "summary") {
    return (
      <Box px="lg">
        <ConvoCard convo={convo} />
      </Box>
    );
  }

  if (isGroupUpdated(row.message)) {
    const groupUpdated = row.message.content as GroupUpdated;
    const initiatorName = memberProfiles.get(
      groupUpdated.initiatedByInboxId,
    )?.name;
    const lines = getGroupUpdatedStrings(
      groupUpdated,
      initiatorName,
      memberProfiles,
    );
    return (
      <div className={`${classes.item} ${classes.systemMessage}`}>
        {lines.map((line) => (
          <Text key={line} size="xs" c="dimmed">
            {line}
          </Text>
        ))}
      </div>
    );
  }

  const reactions = reactionMap.get(row.message.id) ?? new Map();
  const content = getContentString(row.message) ?? "";
  const isHighlighted = highlightedMessageId === row.message.id;
  const wrapperClass = `${classes.item} ${classes.messageWrapper}${isHighlighted ? ` ${classes.messageHighlight}` : ""}`;

  const senderLabel =
    !row.isOwn && row.isFirstInGroup ? (
      <Text size="xs" c="dimmed" className={classes.senderName} pl="sm">
        {memberProfiles.get(row.message.senderInboxId)?.name || "Somebody"}
      </Text>
    ) : null;

  let inner: React.ReactNode;

  if (row.message.content === undefined) {
    const fallbackText =
      row.message.fallback || "This content can't be displayed";
    inner = (
      <Box
        className={`${classes.bubble} ${classes.bubbleUnsupported} ${row.isOwn ? classes.bubbleOwn : classes.bubbleOther}`}>
        <Text c="dimmed" fs="italic" size="sm">
          {fallbackText}
        </Text>
      </Box>
    );
  } else if (isRemoteAttachment(row.message)) {
    inner = (
      <Box
        className={`${classes.attachment} ${row.isOwn ? classes.attachmentOwn : classes.attachmentOther}`}>
        <RemoteAttachmentContent content={row.message.content} />
      </Box>
    );
  } else {
    const replyContent = isTextReply(row.message) ? row.message.content : null;
    const replyContext = replyContent?.inReplyTo ?? null;
    const replyText = replyContext ? getContentString(replyContext) : null;
    const replyReferenceId = replyContent?.referenceId;
    const replySenderName = replyContext
      ? (memberProfiles.get(replyContext.senderInboxId)?.name ?? "Somebody")
      : null;

    inner = (
      <Box
        className={`${classes.bubble} ${row.isOwn ? classes.bubbleOwn : classes.bubbleOther}`}>
        {replyText && (
          <div
            className={`${classes.replyContext} ${row.isOwn ? classes.replyContextOwn : classes.replyContextOther}`}
            onClick={() => {
              if (replyReferenceId) {
                onScrollToMessage(replyReferenceId);
              }
            }}>
            <ReplyIcon size={14} className={classes.replyIcon} />
            <div style={{ overflow: "hidden" }}>
              <Text size="xxs" c="dimmed" truncate>
                {replySenderName}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {replyText}
              </Text>
            </div>
          </div>
        )}
        <Text>{content}</Text>
      </Box>
    );
  }

  return (
    <div className={wrapperClass}>
      <MessageActions
        messageId={row.message.id}
        senderInboxId={row.message.senderInboxId}
        content={content}
        isOwn={row.isOwn}
      />
      {senderLabel}
      {row.isOwn ? (
        inner
      ) : (
        <div className={classes.messageRow}>
          <div className={classes.avatarSlot}>
            {row.isLastInGroup && (
              <AvatarImg inboxId={row.message.senderInboxId} />
            )}
          </div>
          <div className={classes.messageContent}>{inner}</div>
        </div>
      )}
      <ReactionBar
        reactions={reactions}
        messageId={row.message.id}
        senderInboxId={row.message.senderInboxId}
        isOwn={row.isOwn}
      />
    </div>
  );
};

export const MessageList: React.FC<{
  messages: DecodedMessage<BuiltInContentTypes>[];
}> = ({ messages }) => {
  const { convo } = useConvo();
  const inboxId = useInboxId();
  const listRef = useRef<VirtualListHandle>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const { rows, messageIdToIndex } = useMemo(
    () => buildRows(messages, inboxId),
    [messages, inboxId],
  );

  const reactionMap = useMemo(
    () => buildReactionMap(messages, inboxId),
    [messages, inboxId],
  );

  const onScrollToMessage = useCallback(
    (messageId: string) => {
      const index = messageIdToIndex.get(messageId);
      if (index !== undefined) {
        listRef.current?.scrollToIndex(index, { align: "center" });
        if (highlightTimer.current) {
          clearTimeout(highlightTimer.current);
        }
        setHighlightedMessageId(messageId);
        highlightTimer.current = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 1500);
      }
    },
    [messageIdToIndex],
  );

  return (
    <VirtualList
      ref={listRef}
      items={rows}
      getItemKey={(row) => getRowKey(row)}
      estimateSize={44}
      followOutput="auto"
      alignToBottom
      overscan={20}
      outerClassName={classes.root}
      renderItem={(row) => (
        <RowRenderer
          row={row}
          reactionMap={reactionMap}
          onScrollToMessage={onScrollToMessage}
          highlightedMessageId={highlightedMessageId}
          convo={convo}
        />
      )}
    />
  );
};
