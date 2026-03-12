import { Box, Button, Paper, Stack, Text } from "@mantine/core";
import { Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import VirtualList from "@/components/shared/VirtualList";
import { useNav } from "@/contexts/NavContext";
import type { Convo } from "@/db";
import { useConvosFilter, useFilteredConvos } from "@/hooks/useConvosFilter";
import { useIsMobile } from "@/hooks/useMobile";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";
import { ConvoListItem } from "./ConvoListItem";
import classes from "./ConvosList.module.css";

const log = createLogger("convos-list");

export type ConvosListProps = {
  convos: Convo[];
};

const FILTER_LABELS: Record<string, string> = {
  unread: "unread",
  muted: "muted",
  exploding: "exploding",
};

export const ConvosList: React.FC<ConvosListProps> = ({ convos }) => {
  log.trace("render", { count: convos.length });
  const { convoId } = useParams({ strict: false });
  const { closeNav } = useNav();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useConvosFilter();
  const filtered = useFilteredConvos(convos);

  const selectedConversationIndex = useMemo(
    () => filtered.findIndex((convo) => convo.id === convoId),
    [filtered, convoId],
  );

  if (filtered.length === 0) {
    const isFiltered = filter !== "all" && convos.length > 0;
    return (
      <CenteredLayout>
        <Paper p="md" radius="lg" bg="gray.1">
          <Stack align="center" gap="md">
            <Text>
              {isFiltered
                ? `No ${FILTER_LABELS[filter]} convos`
                : "No convos to display"}
            </Text>
            {isFiltered ? (
              <Button
                variant="filled"
                radius="xl"
                size="md"
                onClick={() => {
                  setFilter("all");
                }}>
                Show all
              </Button>
            ) : (
              <Button component={Link} to="/new" variant="filled" radius="xl">
                Start a convo
              </Button>
            )}
          </Stack>
        </Paper>
      </CenteredLayout>
    );
  }

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
