import { Box, Flex, Group, Text } from "@mantine/core";
import type { MessageReactions } from "@/utils/reactions";
import { AvatarImg } from "./AvatarImg";
import { MessageHoverActions } from "./MessageHoverActions";
import classes from "./MessageList.module.css";
import { ReactionBubble } from "./ReactionBubble";

type MessageLayoutProps = {
  messageId: string;
  senderInboxId: string;
  senderName: string | null;
  content: string;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  highlighted: boolean;
  reactions: MessageReactions | null;
  onDoubleClick: () => void;
  onOpenReactionsModal: (messageId: string) => void;
  children: React.ReactNode;
};

export const MessageLayout: React.FC<MessageLayoutProps> = ({
  messageId,
  senderInboxId,
  senderName,
  content,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  highlighted,
  reactions,
  onDoubleClick,
  onOpenReactionsModal,
  children,
}) => {
  const wrapperClass = `${classes.item} ${classes.messageWrapper}${highlighted ? ` ${classes.messageHighlight}` : ""}`;

  return (
    <div
      className={wrapperClass}
      onMouseDown={(e) => {
        if (e.detail >= 2) {
          e.preventDefault();
        }
      }}
      onDoubleClick={onDoubleClick}>
      {!isOwn && isFirstInGroup && (
        <Text size="xs" c="dimmed" className={classes.senderName} pl="sm">
          {senderName || "Somebody"}
        </Text>
      )}
      <Flex
        direction={isOwn ? "row-reverse" : "row"}
        gap="md"
        align="center"
        wrap="nowrap">
        <Box
          className={classes.avatarSlot}
          display={isOwn ? "none" : undefined}>
          {isLastInGroup && <AvatarImg inboxId={senderInboxId} />}
        </Box>
        {children}
        <Box className={classes.hoverActions}>
          <MessageHoverActions
            messageId={messageId}
            senderInboxId={senderInboxId}
            content={content}
            isOwn={isOwn}
          />
        </Box>
      </Flex>
      {reactions && (
        <Group
          gap="md"
          align="center"
          wrap="nowrap"
          justify={isOwn ? "flex-end" : undefined}>
          {!isOwn && <Box className={classes.avatarSlot} />}
          <ReactionBubble
            reactions={reactions}
            isOwn={isOwn}
            onOpen={() => {
              onOpenReactionsModal(messageId);
            }}
          />
        </Group>
      )}
    </div>
  );
};
