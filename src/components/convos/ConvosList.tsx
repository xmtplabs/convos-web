import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useParams } from "@tanstack/react-router";
import { CheckIcon, ListFilterIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { ActionSheet } from "@/components/shared/ActionSheet";
import { Logo } from "@/components/shared/Logo";
import VirtualList from "@/components/shared/VirtualList";
import { useNav } from "@/contexts/NavContext";
import type { Convo } from "@/db";
import { useIsMobile } from "@/hooks/useMobile";
import { createLogger } from "@/utils/log";
import { ConvoListItem } from "./ConvoListItem";
import classes from "./ConvosList.module.css";

const log = createLogger("convos-list");

export type Filter = "all" | "unread";

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
  const [filter, setFilter] = useConvosFilter();

  const filtered = useMemo(
    () => (filter === "unread" ? convos.filter((c) => c.unread) : convos),
    [convos, filter],
  );

  const selectedConversationIndex = useMemo(
    () => filtered.findIndex((convo) => convo.id === convoId),
    [filtered, convoId],
  );
  return (
    <Box className={classes.root}>
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
          <Group gap="xs" align="center" wrap="nowrap">
            <ActionSheet position="bottom">
              <ActionSheet.Target>
                <ActionIcon variant="transparent" radius="xl" size="lg">
                  <ListFilterIcon size={24} />
                </ActionIcon>
              </ActionSheet.Target>
              <ActionSheet.Dropdown>
                <ActionSheet.Item
                  leftSection={
                    filter === "all" ? <CheckIcon size={14} /> : <Box w={14} />
                  }
                  onClick={() => {
                    log.info("filter changed", { filter: "all" });
                    setFilter("all");
                  }}>
                  All
                </ActionSheet.Item>
                <ActionSheet.Item
                  leftSection={
                    filter === "unread" ? (
                      <CheckIcon size={14} />
                    ) : (
                      <Box w={14} />
                    )
                  }
                  onClick={() => {
                    log.info("filter changed", { filter: "unread" });
                    setFilter("unread");
                  }}>
                  Unread
                </ActionSheet.Item>
              </ActionSheet.Dropdown>
            </ActionSheet>
            <ActionIcon
              variant="transparent"
              radius="xl"
              size="lg"
              onClick={closeNav}>
              <XIcon size={24} />
            </ActionIcon>
          </Group>
        </Group>
      )}
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
