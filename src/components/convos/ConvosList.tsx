import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useParams } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useMemo } from "react";
import { Logo } from "@/components/shared/Logo";
import VirtualList from "@/components/shared/VirtualList";
import { useNav } from "@/contexts/NavContext";
import type { Convo } from "@/db";
import { createLogger } from "@/utils/log";
import { ConvoListItem } from "./ConvoListItem";
import classes from "./ConvosList.module.css";

const log = createLogger("convos-list");

export type ConvosListProps = {
  convos: Convo[];
};

export const ConvosList: React.FC<ConvosListProps> = ({ convos }) => {
  log.trace("render", { count: convos.length });
  const { convoId } = useParams({ strict: false });
  const { closeNav } = useNav();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const selectedConversationIndex = useMemo(
    () => convos.findIndex((convo) => convo.id === convoId),
    [convos, convoId],
  );
  return (
    <Box
      className={classes.root}
      onClick={() => {
        if (isMobile) closeNav();
      }}>
      {isMobile && (
        <Group
          className={classes.header}
          align="center"
          justify="space-between"
          px="md"
          wrap="nowrap">
          <Group gap="xxxs" align="center" wrap="nowrap">
            <Logo size={36} />
            <Text fw="bold" size="xl">
              Convos
            </Text>
          </Group>
          <ActionIcon
            variant="transparent"
            radius="xl"
            size="lg"
            onClick={closeNav}>
            <XIcon size={24} />
          </ActionIcon>
        </Group>
      )}
      <VirtualList
        items={convos}
        estimateSize={80}
        getItemKey={(convo) => convo.id}
        initialScrollIndex={Math.max(selectedConversationIndex, 0)}
        outerClassName={classes.outer}
        renderItem={(convo) => (
          <ConvoListItem convo={convo} selected={convo.id === convoId} />
        )}
      />
    </Box>
  );
};
