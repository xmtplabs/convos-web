import { Group, Text, UnstyledButton } from "@mantine/core";
import { memo } from "react";
import type { MessageReactions } from "@/components/messages/MessageList";
import { createLogger } from "@/utils/log";
import classes from "./ReactionBubble.module.css";

const log = createLogger("reaction-bubble");

export const ReactionBubble: React.FC<{
  reactions: MessageReactions;
  isOwn: boolean;
  onOpen: () => void;
}> = memo(({ reactions, isOwn, onOpen }) => {
  log.trace("render");

  const uniqueEmojis = [...reactions.byEmoji.keys()];

  if (uniqueEmojis.length === 0) {
    return null;
  }

  const showCount = reactions.totalCount > uniqueEmojis.length;

  return (
    <Group
      align="center"
      wrap="nowrap"
      mt="xxxs"
      justify={isOwn ? "flex-end" : "flex-start"}>
      <UnstyledButton
        py="xxxs"
        px="xs"
        className={classes.bubble}
        onClick={onOpen}>
        {uniqueEmojis.map((emoji) => (
          <span key={emoji}>{emoji}</span>
        ))}
        {showCount && (
          <Text component="span" size="xs" c="dimmed" ml="xxxs">
            {reactions.totalCount}
          </Text>
        )}
      </UnstyledButton>
    </Group>
  );
});
