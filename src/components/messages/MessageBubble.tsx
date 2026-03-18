import {
  ReactionAction,
  ReactionSchema,
  type BuiltInContentTypes,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { useCallback } from "react";
import type { ResolvedConvo } from "@/contexts/ConvoContext";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";
import type { MessageReactions, ReactionMap } from "@/utils/reactions";
import { getContentString } from "@/utils/xmtp";
import { MessageContent } from "./MessageContent";
import { MessageLayout } from "./MessageLayout";

const log = createLogger("message-bubble");

export type MessageBubbleProps = {
  message: DecodedMessage<BuiltInContentTypes>;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  reactions: MessageReactions | null;
  highlighted: boolean;
  convo: ResolvedConvo;
  reactionMap: ReactionMap;
  onScrollToMessage: (messageId: string) => void;
  onOpenReactionsModal: (messageId: string) => void;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  reactions,
  highlighted,
  convo,
  reactionMap,
  onScrollToMessage,
  onOpenReactionsModal,
}) => {
  log.trace("render");
  const { memberProfiles } = useConvo();
  const { sendReaction } = useConvoMessaging();

  const handleDoubleClick = useCallback(() => {
    const emoji = convo.quickReactionEmoji;
    const existing = reactionMap.get(message.id)?.byEmoji.get(emoji);
    const action = existing?.reacted
      ? ReactionAction.Removed
      : ReactionAction.Added;
    log.info("quick reaction", { emoji, action });
    void sendReaction({
      reference: message.id,
      referenceInboxId: message.senderInboxId,
      action,
      content: emoji,
      schema: ReactionSchema.Unicode,
    });
  }, [
    convo.quickReactionEmoji,
    reactionMap,
    sendReaction,
    message.id,
    message.senderInboxId,
  ]);

  const content = getContentString(message) ?? "";

  return (
    <MessageLayout
      messageId={message.id}
      senderInboxId={message.senderInboxId}
      senderName={memberProfiles.get(message.senderInboxId)?.name ?? null}
      content={content}
      isOwn={isOwn}
      isFirstInGroup={isFirstInGroup}
      isLastInGroup={isLastInGroup}
      highlighted={highlighted}
      reactions={reactions}
      onDoubleClick={handleDoubleClick}
      onOpenReactionsModal={onOpenReactionsModal}>
      <MessageContent
        message={message}
        content={content}
        isOwn={isOwn}
        onScrollToMessage={onScrollToMessage}
      />
    </MessageLayout>
  );
};
