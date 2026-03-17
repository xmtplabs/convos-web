import { Avatar, Box, Group, Stack, Text } from "@mantine/core";
import {
  isGroupUpdated,
  isReaction,
  isRemoteAttachment,
  isTextReply,
  ReactionAction,
  ReactionSchema,
  type BuiltInContentTypes,
  type DecodedMessage,
  type GroupUpdated,
  type Reaction,
} from "@xmtp/browser-sdk";
import { InfoIcon, ReplyIcon } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import { ReactionsModal } from "@/components/modals/ReactionsModal";
import { UnstyledLink } from "@/components/shared/UnstyledLink";
import VirtualList, {
  type VirtualListHandle,
} from "@/components/shared/VirtualList";
import type { ResolvedConvo } from "@/contexts/ConvoContext";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { isExplodeSettings } from "@/utils/explode";
import { createLogger } from "@/utils/log";
import { getContentString, getGroupUpdatedStrings } from "@/utils/xmtp";
import { MessageHoverActions } from "./MessageHoverActions";
import classes from "./MessageList.module.css";
import { ReactionBubble } from "./ReactionBubble";
import { RemoteAttachmentContent } from "./RemoteAttachmentContent";

const log = createLogger("message-list");

export type ReactionEntry = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type UserReaction = {
  inboxId: string;
  emojis: string[];
};

export type MessageReactions = {
  byEmoji: Map<string, ReactionEntry>;
  byUser: UserReaction[];
  totalCount: number;
};

// intermediate: emoji -> Set<inboxId>
type ReactionAccumulator = Map<string, Set<string>>;

type ReactionMap = Map<string, MessageReactions>;

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

const addReactionToAccumulator = (
  acc: Map<string, ReactionAccumulator>,
  reference: string,
  reaction: Reaction,
  senderInboxId: string,
) => {
  if (!reaction.content) return;

  let msgAcc = acc.get(reference);
  if (!msgAcc) {
    msgAcc = new Map();
    acc.set(reference, msgAcc);
  }

  if (reaction.action === ReactionAction.Added) {
    let senders = msgAcc.get(reaction.content);
    if (!senders) {
      senders = new Set();
      msgAcc.set(reaction.content, senders);
    }
    senders.add(senderInboxId);
  } else if (reaction.action === ReactionAction.Removed) {
    const senders = msgAcc.get(reaction.content);
    if (senders) {
      senders.delete(senderInboxId);
      if (senders.size === 0) {
        msgAcc.delete(reaction.content);
      }
    }
  }
};

const buildReactionMap = (
  messages: DecodedMessage<BuiltInContentTypes>[],
  inboxId: string,
): ReactionMap => {
  const acc = new Map<string, ReactionAccumulator>();

  for (const msg of messages) {
    if (!isReaction(msg) && msg.reactions.length > 0) {
      for (const r of msg.reactions) {
        const reaction = r.content as Reaction;
        if (reaction.reference) {
          addReactionToAccumulator(
            acc,
            reaction.reference,
            reaction,
            r.senderInboxId,
          );
        }
      }
    }
    if (isReaction(msg)) {
      const reaction = msg.content as Reaction;
      if (reaction.reference) {
        addReactionToAccumulator(
          acc,
          reaction.reference,
          reaction,
          msg.senderInboxId,
        );
      }
    }
  }

  const map: ReactionMap = new Map();

  for (const [messageId, msgAcc] of acc) {
    const byEmoji = new Map<string, ReactionEntry>();
    const userMap = new Map<string, string[]>();
    let totalCount = 0;

    for (const [emoji, senders] of msgAcc) {
      byEmoji.set(emoji, {
        emoji,
        count: senders.size,
        reacted: senders.has(inboxId),
      });
      totalCount += senders.size;

      for (const sender of senders) {
        let emojis = userMap.get(sender);
        if (!emojis) {
          emojis = [];
          userMap.set(sender, emojis);
        }
        emojis.push(emoji);
      }
    }

    const byUser: UserReaction[] = [];
    if (userMap.has(inboxId)) {
      byUser.push({ inboxId, emojis: userMap.get(inboxId) ?? [] });
      userMap.delete(inboxId);
    }
    for (const [uid, emojis] of userMap) {
      byUser.push({ inboxId: uid, emojis });
    }

    map.set(messageId, { byEmoji, byUser, totalCount });
  }

  return map;
};

const buildRows = (
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

const formatDuration = (ms: number): string => {
  if (ms <= 0) return "now";
  const s = Math.round(ms / 1000);
  if (s >= 79200) {
    const days = Math.round(s / 86400);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  if (s >= 3000) {
    const hours = Math.round(s / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  if (s >= 50) {
    const minutes = Math.round(s / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `${s} second${s !== 1 ? "s" : ""}`;
};

const ExplodeNotification: React.FC<{
  initiatorInboxId: string;
  sentAtNs: bigint;
  expiresAtUnix: number;
}> = ({ initiatorInboxId, sentAtNs, expiresAtUnix }) => {
  const { convo, memberProfiles } = useConvo();
  const inboxId = useInboxId();
  const src = useAvatar(convo.id, initiatorInboxId);
  const profile = memberProfiles.get(initiatorInboxId);
  const isYou = initiatorInboxId === inboxId;
  const name = isYou ? "You" : (profile?.name ?? "Somebody");

  const sentMs = Number(sentAtNs / 1_000_000n);
  const durationMs = expiresAtUnix * 1000 - sentMs;
  const durationText = formatDuration(durationMs);

  return (
    <div className={`${classes.item} ${classes.systemMessage}`}>
      <Group gap={4} justify="center" align="center">
        <Avatar size={20} radius="xl" src={src}>
          {!src && (profile?.name ? profile.name[0].toUpperCase() : "S")}
        </Avatar>
        <Text size="xs" c="dimmed">
          {name} set this convo to explode in {durationText}
        </Text>
      </Group>
    </div>
  );
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

const RowRenderer = memo(
  ({
    row,
    reactionMap,
    onScrollToMessage,
    onOpenReactionsModal,
    highlightedMessageId,
    convo,
  }: {
    row: Row;
    reactionMap: ReactionMap;
    onScrollToMessage: (messageId: string) => void;
    onOpenReactionsModal: (messageId: string) => void;
    highlightedMessageId: string | null;
    convo: ResolvedConvo;
  }) => {
    const { memberProfiles } = useConvo();
    const { sendReaction } = useConvoMessaging();

    const handleDoubleClick = useCallback(
      (messageId: string, senderInboxId: string) => {
        const emoji = convo.quickReactionEmoji;
        const existing = reactionMap.get(messageId)?.byEmoji.get(emoji);
        const action = existing?.reacted
          ? ReactionAction.Removed
          : ReactionAction.Added;
        log.info("quick reaction", { emoji, messageId, action });
        void sendReaction({
          reference: messageId,
          referenceInboxId: senderInboxId,
          action,
          content: emoji,
          schema: ReactionSchema.Unicode,
        });
      },
      [convo.quickReactionEmoji, reactionMap, sendReaction],
    );

    if (row.type === "time") {
      return (
        <Group justify="center" className={classes.item} pt="md" pb="xxs">
          <Text size="xs" c="dimmed">
            {row.label}
          </Text>
        </Group>
      );
    }

    if (row.type === "summary") {
      return (
        <Box px="lg" pt="lg">
          <ConvoCard convo={convo} />

          <Stack gap="xxxs" align="center" p="md">
            <UnstyledLink
              to="."
              search={(prev) => ({ ...prev, modal: "convo-info" })}>
              <Group gap="xxxs" align="center">
                <Text size="xs">New convo, new everything</Text>
                <InfoIcon size={16} />
              </Group>
            </UnstyledLink>
            <Text size="xs" c="dimmed">
              For privacy, new members can&apos;t see earlier messages.
            </Text>
          </Stack>
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
      const hasUnrecognized =
        groupUpdated.metadataFieldChanges.length > lines.length;
      return (
        <>
          {lines.length > 0 && (
            <Stack gap={0} align="center" className={classes.item}>
              {lines.map((line) => (
                <Text key={line} size="xs" c="dimmed">
                  {line}
                </Text>
              ))}
            </Stack>
          )}
          {hasUnrecognized && convo.expiresAtUnix != null && (
            <ExplodeNotification
              initiatorInboxId={groupUpdated.initiatedByInboxId}
              sentAtNs={row.message.sentAtNs}
              expiresAtUnix={convo.expiresAtUnix}
            />
          )}
        </>
      );
    }

    const reactions = reactionMap.get(row.message.id) ?? null;
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
          className={`${classes.attachment} ${row.isOwn ? "" : classes.attachmentOther}`}>
          <RemoteAttachmentContent content={row.message.content} />
        </Box>
      );
    } else {
      const replyContent = isTextReply(row.message)
        ? row.message.content
        : null;
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
            <Group
              gap={6}
              align="flex-start"
              wrap="nowrap"
              className={`${classes.replyContext} ${row.isOwn ? "" : classes.replyContextOther}`}
              onClick={() => {
                if (replyReferenceId) {
                  onScrollToMessage(replyReferenceId);
                }
              }}>
              <ReplyIcon size={14} className={classes.replyIcon} />
              <Box style={{ overflow: "hidden" }}>
                <Text size="xxs" c="dimmed" truncate>
                  {replySenderName}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {replyText}
                </Text>
              </Box>
            </Group>
          )}
          <Text>{content}</Text>
        </Box>
      );
    }

    return (
      <div
        className={wrapperClass}
        onMouseDown={(e) => {
          if (e.detail >= 2) {
            e.preventDefault();
          }
        }}
        onDoubleClick={() => {
          handleDoubleClick(row.message.id, row.message.senderInboxId);
        }}>
        {senderLabel}
        {row.isOwn ? (
          <>
            <Group gap="md" justify="flex-end" align="center" wrap="nowrap">
              <Box className={classes.hoverActions}>
                <MessageHoverActions
                  messageId={row.message.id}
                  senderInboxId={row.message.senderInboxId}
                  content={content}
                  isOwn
                />
              </Box>
              {inner}
            </Group>
            {reactions && (
              <ReactionBubble
                reactions={reactions}
                isOwn
                onOpen={() => {
                  onOpenReactionsModal(row.message.id);
                }}
              />
            )}
          </>
        ) : (
          <Box flex={1} miw={0}>
            <Group gap="md" align="center" wrap="nowrap">
              <Box className={classes.avatarSlot}>
                {row.isLastInGroup && (
                  <AvatarImg inboxId={row.message.senderInboxId} />
                )}
              </Box>
              {inner}
              <Box className={classes.hoverActions}>
                <MessageHoverActions
                  messageId={row.message.id}
                  senderInboxId={row.message.senderInboxId}
                  content={content}
                  isOwn={false}
                />
              </Box>
            </Group>
            {reactions && (
              <Group gap="md" align="center" wrap="nowrap">
                <Box className={classes.avatarSlot} />
                <ReactionBubble
                  reactions={reactions}
                  isOwn={false}
                  onOpen={() => {
                    onOpenReactionsModal(row.message.id);
                  }}
                />
              </Group>
            )}
          </Box>
        )}
      </div>
    );
  },
);

export const MessageList: React.FC<{
  messages: DecodedMessage<BuiltInContentTypes>[];
}> = ({ messages }) => {
  const { convo } = useConvo();
  const inboxId = useInboxId();
  const listRef = useRef<VirtualListHandle>(null);

  log.trace("render", {
    messageCount: messages.length,
    convoId: convo.id,
  });
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [reactionsModalMessageId, setReactionsModalMessageId] = useState<
    string | null
  >(null);

  const { rows, messageIdToIndex } = useMemo(
    () => buildRows(messages, inboxId, convo.expiresAtUnix),
    [messages, inboxId, convo.expiresAtUnix],
  );

  const reactionMap = useMemo(
    () => buildReactionMap(messages, inboxId),
    [messages, inboxId],
  );

  const onScrollToMessage = useCallback(
    (messageId: string) => {
      log.info("onScrollToMessage", { messageId });
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

  const renderItem = useCallback(
    (row: Row) => (
      <RowRenderer
        row={row}
        reactionMap={reactionMap}
        onScrollToMessage={onScrollToMessage}
        onOpenReactionsModal={setReactionsModalMessageId}
        highlightedMessageId={highlightedMessageId}
        convo={convo}
      />
    ),
    [reactionMap, onScrollToMessage, highlightedMessageId, convo],
  );

  return (
    <>
      <VirtualList
        ref={listRef}
        items={rows}
        getItemKey={getRowKey}
        estimateSize={44}
        followOutput="auto"
        overscan={20}
        outerClassName={classes.root}
        renderItem={renderItem}
      />
      {(() => {
        if (!reactionsModalMessageId) return null;
        const modalReactions = reactionMap.get(reactionsModalMessageId);
        if (!modalReactions) return null;
        return (
          <ReactionsModal
            reactions={modalReactions}
            messageId={reactionsModalMessageId}
            senderInboxId={
              messages.find((m) => m.id === reactionsModalMessageId)
                ?.senderInboxId ?? ""
            }
            onClose={() => {
              setReactionsModalMessageId(null);
            }}
          />
        );
      })()}
    </>
  );
};
