import type { BuiltInContentTypes, DecodedMessage } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef, useState } from "react";
import { ReactionsModal } from "@/components/modals/ReactionsModal";
import VirtualList, {
  type VirtualListHandle,
} from "@/components/shared/VirtualList";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createLogger } from "@/utils/log";
import { buildRows, getRowKey, type Row } from "@/utils/messageRows";
import { buildReactionMap } from "@/utils/reactions";
import classes from "./MessageList.module.css";
import { RowRenderer } from "./RowRenderer";

const log = createLogger("message-list");

export type MessageListProps = {
  messages: DecodedMessage<BuiltInContentTypes>[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
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

  const modalReactions = reactionsModalMessageId
    ? reactionMap.get(reactionsModalMessageId)
    : undefined;

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
      {reactionsModalMessageId && modalReactions && (
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
      )}
    </>
  );
};
