import { Box } from "@mantine/core";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { ConvoCard } from "@/components/ConvoCard";
import VirtualList from "@/components/VirtualList";
import type { Convo } from "@/db";
import classes from "./ConvosList.module.css";

export type ConvosListProps = {
  convos: Convo[];
};

export const ConvosList: React.FC<ConvosListProps> = ({ convos }) => {
  const { convoId } = useParams({ strict: false });
  const selectedConversationIndex = useMemo(
    () => convos.findIndex((convo) => convo.id === convoId),
    [convos, convoId],
  );
  return (
    <Box className={classes.root}>
      <VirtualList
        items={convos}
        estimateSize={80}
        getItemKey={(convo) => convo.id}
        initialScrollIndex={Math.max(selectedConversationIndex, 0)}
        outerClassName={classes.outer}
        renderItem={(convo) => (
          <ConvoCard convo={convo} selected={convo.id === convoId} />
        )}
      />
    </Box>
  );
};
