import { isGroupUpdated, type GroupUpdated } from "@xmtp/browser-sdk";
import { memo } from "react";
import type { ResolvedConvo } from "@/contexts/ConvoContext";
import type { Row } from "@/utils/messageRows";
import type { ReactionMap } from "@/utils/reactions";
import { ConvoSummary } from "./ConvoSummary";
import { GroupUpdatedContent } from "./GroupUpdatedContent";
import { MessageBubble } from "./MessageBubble";
import { TimeRow } from "./TimeRow";

export type RowRendererProps = {
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
    if (row.type === "time") {
      return <TimeRow row={row} />;
    }

    if (row.type === "summary") {
      return <ConvoSummary convo={convo} />;
    }

    if (isGroupUpdated(row.message)) {
      return (
        <GroupUpdatedContent
          message={row.message}
          groupUpdated={row.message.content as GroupUpdated}
          convo={convo}
        />
      );
    }

    return (
      <MessageBubble
        message={row.message}
        isOwn={row.isOwn}
        isFirstInGroup={row.isFirstInGroup}
        isLastInGroup={row.isLastInGroup}
        reactions={reactionMap.get(row.message.id) ?? null}
        highlighted={highlightedMessageId === row.message.id}
        convo={convo}
        reactionMap={reactionMap}
        onScrollToMessage={onScrollToMessage}
        onOpenReactionsModal={onOpenReactionsModal}
      />
    );
  },
);
