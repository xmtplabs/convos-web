import { ActionIcon, Flex } from "@mantine/core";
import { ReactionAction, ReactionSchema } from "@xmtp/browser-sdk";
import { ReplyIcon, SmilePlusIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { createLogger } from "@/utils/log";

const log = createLogger("message-hover-actions");

export const MessageHoverActions: React.FC<{
  messageId: string;
  senderInboxId: string;
  content: string;
  isOwn: boolean;
}> = memo(({ messageId, senderInboxId, content, isOwn }) => {
  log.trace("render");
  const { sendReaction, setReply } = useConvoMessaging();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleReaction = useCallback(
    (emoji: string) => {
      log.info("reaction added", { emoji, messageId });
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
    log.info("reply triggered", { messageId });
    setReply({ messageId, senderInboxId, content });
  }, [messageId, senderInboxId, content, setReply]);

  return (
    <Flex direction={isOwn ? "row-reverse" : "row"} gap="sm" align="center">
      <EmojiPicker
        opened={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
        }}
        onSelect={handleReaction}>
        <ActionIcon
          size="md"
          variant="transparent"
          c="dimmed"
          radius="xl"
          onClick={() => {
            setPickerOpen((o) => !o);
          }}>
          <SmilePlusIcon size={24} />
        </ActionIcon>
      </EmojiPicker>
      <ActionIcon
        size="md"
        variant="transparent"
        c="dimmed"
        radius="xl"
        onClick={handleReply}>
        <ReplyIcon size={24} />
      </ActionIcon>
    </Flex>
  );
});
