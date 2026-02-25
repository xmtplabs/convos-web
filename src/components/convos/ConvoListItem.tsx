import { Avatar, Group, Stack, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import { ImageIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Convo } from "@/db";
import { useAvatar } from "@/hooks/useAvatar";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import classes from "./ConvoListItem.module.css";

const formatTime = (convo: Convo): string | undefined => {
  const ns = convo.lastUpdatedAtNs;
  if (ns == null) {
    return undefined;
  }
  const seconds = Math.floor((Date.now() - Number(ns / 1_000_000n)) / 1000);
  if (seconds < 60) {
    return "now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export type ConvoListItemProps = {
  convo: Convo;
  selected?: boolean;
};

const useRelativeTime = (convo: Convo) => {
  const [time, setTime] = useState(() => formatTime(convo));
  const interval = useInterval(() => {
    setTime(formatTime(convo));
  }, 60_000);

  useEffect(() => {
    setTime(formatTime(convo));
    interval.start();
    return interval.stop;
  }, [convo.lastUpdatedAtNs]);

  return time;
};

export const ConvoListItem: React.FC<ConvoListItemProps> = ({
  convo,
  selected,
}) => {
  const time = useRelativeTime(convo);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);

  return (
    <Link
      className={classes.link}
      to={`/convo/$convoId`}
      params={{ convoId: convo.id }}>
      <Group
        data-selected={selected || undefined}
        gap="xs"
        align="center"
        wrap="nowrap"
        className={classes.root}>
        <Avatar radius="xl" size="md" flex="0 0 auto" src={groupImage}>
          {!groupImage && <ImageIcon size={16} />}
        </Avatar>
        <Stack
          flex="1 1 auto"
          gap="0"
          align="flex-start"
          style={{ overflow: "hidden" }}>
          <Group gap="xxxs" wrap="nowrap" maw="100%">
            {convo.faved && <StarIcon size={14} style={{ flexShrink: 0 }} />}
            <Text truncate flex="1 1 auto">
              {convo.name}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" truncate>
            {time}
          </Text>
        </Stack>
      </Group>
    </Link>
  );
};
