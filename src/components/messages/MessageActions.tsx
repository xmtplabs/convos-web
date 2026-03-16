import { ActionIcon, Group } from "@mantine/core";
import { ReactionAction, ReactionSchema } from "@xmtp/browser-sdk";
import { MessageCircleReplyIcon, SmilePlusIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useSendMessage } from "@/hooks/useSendMessage";
import { createLogger } from "@/utils/log";
import classes from "./MessageList.module.css";

const log = createLogger("messaging");

const quickEmojis = ["👍", "❤️", "😂", "😢", "🙏"];

export const MessageActions: React.FC<{
  messageId: string;
  senderInboxId: string;
  content: string;
  isOwn: boolean;
}> = memo(({ messageId, senderInboxId, content, isOwn }) => {
  const { sendReaction, setReply } = useSendMessage();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleReaction = useCallback(
    (emoji: string) => {
      log.info("handleReaction", { emoji, messageId });
      void sendReaction({
        reference: messageId,
        referenceInboxId: senderInboxId,
        action: ReactionAction.Added,
        content: emoji,
        schema: ReactionSchema.Unicode,
      });
    },
    [messageId, senderInboxId, sendReaction],
  );

  const handleReply = useCallback(() => {
    log.info("handleReply", { messageId });
    setReply({ messageId, senderInboxId, content });
  }, [messageId, senderInboxId, content, setReply]);

  return (
    <Group
      gap={2}
      className={`${classes.messageActions} ${isOwn ? classes.messageActionsOwn : classes.messageActionsOther}`}>
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={classes.quickEmoji}
          onClick={() => {
            handleReaction(emoji);
          }}>
          {emoji}
        </button>
      ))}
      <EmojiPicker
        opened={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
        }}
        onSelect={handleReaction}>
        <ActionIcon
          size="md"
          variant="subtle"
          radius="xl"
          onClick={() => {
            setPickerOpen((o) => !o);
          }}>
          <SmilePlusIcon size={20} />
        </ActionIcon>
      </EmojiPicker>
      <ActionIcon size="md" variant="subtle" radius="xl" onClick={handleReply}>
        <MessageCircleReplyIcon size={20} />
      </ActionIcon>
    </Group>
  );
});
