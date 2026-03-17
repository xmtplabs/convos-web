import { Avatar, Popover, Stack, Text } from "@mantine/core";
import { ReactionAction, ReactionSchema } from "@xmtp/browser-sdk";
import { useCallback, useState } from "react";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { Modal } from "@/components/shared/Modal";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createLogger } from "@/utils/log";
import type { MessageReactions } from "@/utils/reactions";
import classes from "./ReactionsModal.module.css";

const log = createLogger("reactions-modal");

const MAX_VISIBLE_EMOJIS = 5;

const EmojiButton: React.FC<{
  emoji: string;
  onClick: () => void;
}> = ({ emoji, onClick }) => (
  <button type="button" className={classes.emoji} onClick={onClick}>
    {emoji}
  </button>
);

const UserRow: React.FC<{
  inboxId: string;
  emojis: string[];
  isYou: boolean;
  onEmojiClick: (emoji: string, isYou: boolean) => void;
  convoId: string;
}> = ({ inboxId, emojis, isYou, onEmojiClick, convoId }) => {
  const { memberProfiles } = useConvo();
  const avatar = useAvatar(convoId, inboxId);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const name = memberProfiles.get(inboxId)?.name ?? "Somebody";

  const visibleEmojis = emojis.slice(0, MAX_VISIBLE_EMOJIS);
  const overflowCount = emojis.length - MAX_VISIBLE_EMOJIS;

  return (
    <GroupedListItem>
      <div className={classes.row}>
        <Avatar size={40} radius="xl" src={avatar}>
          {name[0].toUpperCase()}
        </Avatar>
        <Stack gap={0} className={classes.name}>
          <Text size="sm" truncate>
            {name}
          </Text>
          {isYou && (
            <Text size="xs" c="dimmed">
              Select to remove
            </Text>
          )}
        </Stack>
        <div className={classes.emojis}>
          {visibleEmojis.map((emoji) => (
            <EmojiButton
              key={emoji}
              emoji={emoji}
              onClick={() => {
                onEmojiClick(emoji, isYou);
              }}
            />
          ))}
          {overflowCount > 0 && (
            <Popover
              opened={overflowOpen}
              onChange={setOverflowOpen}
              position="bottom-end"
              withArrow
              shadow="md">
              <Popover.Target>
                <button
                  type="button"
                  className={classes.overflow}
                  onClick={() => {
                    setOverflowOpen((o) => !o);
                  }}>
                  +{overflowCount}
                </button>
              </Popover.Target>
              <Popover.Dropdown p="xs">
                <div className={classes.emojis}>
                  {emojis.map((emoji) => (
                    <EmojiButton
                      key={emoji}
                      emoji={emoji}
                      onClick={() => {
                        onEmojiClick(emoji, isYou);
                        setOverflowOpen(false);
                      }}
                    />
                  ))}
                </div>
              </Popover.Dropdown>
            </Popover>
          )}
        </div>
      </div>
    </GroupedListItem>
  );
};

export const ReactionsModal: React.FC<{
  reactions: MessageReactions;
  messageId: string;
  senderInboxId: string;
  onClose: () => void;
}> = ({ reactions, messageId, senderInboxId, onClose }) => {
  const { sendReaction } = useConvoMessaging();
  const { convo } = useConvo();
  const inboxId = useInboxId();

  const handleEmojiClick = useCallback(
    (emoji: string, isYou: boolean) => {
      const action = isYou ? ReactionAction.Removed : ReactionAction.Added;
      log.info("emoji clicked", { emoji, messageId, action });
      void sendReaction({
        reference: messageId,
        referenceInboxId: senderInboxId,
        action,
        content: emoji,
        schema: ReactionSchema.Unicode,
      });
    },
    [messageId, senderInboxId, sendReaction],
  );

  return (
    <Modal onClose={onClose} title="Reactions">
      <div className={classes.scrollArea}>
        <GroupedList>
          {reactions.byUser.map((user) => (
            <UserRow
              key={user.inboxId}
              inboxId={user.inboxId}
              emojis={user.emojis}
              isYou={user.inboxId === inboxId}
              onEmojiClick={handleEmojiClick}
              convoId={convo.id}
            />
          ))}
        </GroupedList>
      </div>
    </Modal>
  );
};
