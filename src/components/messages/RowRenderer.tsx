import { Box, Group, Stack, Text } from "@mantine/core";
import {
  isGroupUpdated,
  isRemoteAttachment,
  isTextReply,
  ReactionAction,
  ReactionSchema,
  type GroupUpdated,
} from "@xmtp/browser-sdk";
import { InfoIcon, ReplyIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import { UnstyledLink } from "@/components/shared/UnstyledLink";
import type { ResolvedConvo } from "@/contexts/ConvoContext";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";
import type { Row } from "@/utils/messageRows";
import type { ReactionMap } from "@/utils/reactions";
import { getContentString, getGroupUpdatedStrings } from "@/utils/xmtp";
import { AvatarImg } from "./AvatarImg";
import { ExplodeNotification } from "./ExplodeNotification";
import { MessageHoverActions } from "./MessageHoverActions";
import classes from "./MessageList.module.css";
import { ReactionBubble } from "./ReactionBubble";
import { RemoteAttachmentContent } from "./RemoteAttachmentContent";

const log = createLogger("message-list");

type RowRendererProps = {
  row: Row;
  reactionMap: ReactionMap;
  onScrollToMessage: (messageId: string) => void;
  onOpenReactionsModal: (messageId: string) => void;
  highlightedMessageId: string | null;
  convo: ResolvedConvo;
};

export const RowRenderer = memo(
  ({
    row,
    reactionMap,
    onScrollToMessage,
    onOpenReactionsModal,
    highlightedMessageId,
    convo,
  }: RowRendererProps) => {
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
