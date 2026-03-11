import { Box } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import VirtualList from "@/components/shared/VirtualList";
import { useNav } from "@/contexts/NavContext";
import type { Convo } from "@/db";
import { useIsMobile } from "@/hooks/useMobile";
import { createLogger } from "@/utils/log";
import { ConvoListItem } from "./ConvoListItem";
import classes from "./ConvosList.module.css";

const log = createLogger("convos-list");

export type Filter = "all" | "unread" | "muted";

export type ConvosListProps = {
  convos: Convo[];
};

export const useConvosFilter = () =>
  useLocalStorage<Filter>({
    key: "convos-filter",
    defaultValue: "all",
  });

export const ConvosList: React.FC<ConvosListProps> = ({ convos }) => {
  log.trace("render", { count: convos.length });
  const { convoId } = useParams({ strict: false });
  const { closeNav } = useNav();
  const isMobile = useIsMobile();
  const [filter] = useConvosFilter();

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return convos.filter((c) => c.unread);
    }
    if (filter === "muted") {
      return convos.filter((c) => c.muted);
    }
    return convos;
  }, [convos, filter]);

  const selectedConversationIndex = useMemo(
    () => filtered.findIndex((convo) => convo.id === convoId),
    [filtered, convoId],
  );
  return (
    <Box className={classes.root}>
      <VirtualList
        items={filtered}
        estimateSize={80}
        getItemKey={(convo) => convo.id}
        initialScrollIndex={Math.max(selectedConversationIndex, 0)}
        outerClassName={classes.outer}
        renderItem={(convo) => (
          <div onClick={isMobile ? closeNav : undefined}>
            <ConvoListItem convo={convo} selected={convo.id === convoId} />
          </div>
        )}
      />
    </Box>
  );
};
