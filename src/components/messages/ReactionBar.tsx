import { ReactionAction, ReactionSchema } from "@xmtp/browser-sdk";
import { memo, useCallback } from "react";
import { useSendMessage } from "@/hooks/useSendMessage";
import { createLogger } from "@/utils/log";
import classes from "./MessageList.module.css";

const log = createLogger("messaging");

export type ReactionEntry = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export const ReactionBar: React.FC<{
  reactions: Map<string, ReactionEntry>;
  messageId: string;
  senderInboxId: string;
  isOwn: boolean;
}> = memo(({ reactions, messageId, senderInboxId, isOwn }) => {
  const { sendReaction } = useSendMessage();

  const handleClick = useCallback(
    (emoji: string, alreadyReacted: boolean) => {
      log.info("handleClick toggle reaction", {
        emoji,
        messageId,
        alreadyReacted,
      });
      void sendReaction({
        reference: messageId,
        referenceInboxId: senderInboxId,
        action: alreadyReacted ? ReactionAction.Removed : ReactionAction.Added,
        content: emoji,
        schema: ReactionSchema.Unicode,
      });
    },
    [messageId, senderInboxId, sendReaction],
  );

  if (reactions.size === 0) {
    return null;
  }

  return (
    <div
      className={`${classes.reactionBar} ${isOwn ? classes.reactionBarOwn : classes.reactionBarOther}`}>
      {[...reactions.values()].map((entry) => (
        <button
          key={entry.emoji}
          type="button"
          className={`${classes.reactionPill} ${entry.reacted ? classes.reactionPillReacted : ""}`}
          onClick={() => {
            handleClick(entry.emoji, entry.reacted);
          }}>
          {entry.emoji} {entry.count}
        </button>
      ))}
    </div>
  );
});
