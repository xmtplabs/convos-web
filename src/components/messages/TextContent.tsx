import { Box, Group, Text } from "@mantine/core";
import {
  isTextReply,
  type BuiltInContentTypes,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { ReplyIcon } from "lucide-react";
import { useConvo } from "@/hooks/useConvo";
import { getContentString } from "@/utils/xmtp";
import classes from "./MessageList.module.css";

export type TextContentProps = {
  message: DecodedMessage<BuiltInContentTypes>;
  content: string;
  isOwn: boolean;
  onScrollToMessage: (messageId: string) => void;
};

export const TextContent: React.FC<TextContentProps> = ({
  message,
  content,
  isOwn,
  onScrollToMessage,
}) => {
  const { memberProfiles } = useConvo();
  const replyContent = isTextReply(message) ? message.content : null;
  const replyContext = replyContent?.inReplyTo ?? null;
  const replyText = replyContext ? getContentString(replyContext) : null;
  const replyReferenceId = replyContent?.referenceId;
  const replySenderName = replyContext
    ? (memberProfiles.get(replyContext.senderInboxId)?.name ?? "Somebody")
    : null;

  return (
    <Box
      className={`${classes.bubble} ${isOwn ? classes.bubbleOwn : classes.bubbleOther}`}>
      {replyText && (
        <Group
          gap={6}
          align="flex-start"
          wrap="nowrap"
          className={`${classes.replyContext} ${isOwn ? "" : classes.replyContextOther}`}
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
};
