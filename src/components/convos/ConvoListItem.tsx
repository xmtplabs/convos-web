import { Avatar, Badge, Group, Stack, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import { BellOffIcon, ImageIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Convo } from "@/db";
import { useAvatar } from "@/hooks/useAvatar";
import { useExplodeCountdown } from "@/hooks/useExplodeCountdown";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import classes from "./ConvoListItem.module.css";

const formatTime = (ns: bigint | undefined): string | undefined => {
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

const useRelativeTime = (lastUpdatedAtNs: bigint | undefined) => {
  const [time, setTime] = useState(() => formatTime(lastUpdatedAtNs));
  const interval = useInterval(() => {
    setTime(formatTime(lastUpdatedAtNs));
  }, 60_000);

  useEffect(() => {
    setTime(formatTime(lastUpdatedAtNs));
    interval.start();
    return interval.stop;
  }, [lastUpdatedAtNs, interval]);

  return time;
};

export const ConvoListItem: React.FC<ConvoListItemProps> = ({
  convo,
  selected,
}) => {
  const time = useRelativeTime(convo.lastUpdatedAtNs);
  const explodeCountdown = useExplodeCountdown(convo.expiresAtUnix);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);

  return (
    <Link
      className={classes.link}
      to="/convo/$convoId"
      params={{ convoId: convo.id }}>
      <Group
        data-selected={selected || undefined}
        data-unread={convo.unread || undefined}
        gap="xs"
        align="center"
        wrap="nowrap"
        className={classes.root}>
        <Avatar radius="xl" size="md" flex="0 0 auto" src={groupImage}>
          {!groupImage && <ImageIcon size={24} />}
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
            {explodeCountdown && (
              <Badge
                color="red"
                variant="light"
                size="sm"
                style={{ flexShrink: 0 }}>
                {explodeCountdown}
              </Badge>
            )}
            {convo.muted && (
              <BellOffIcon
                size={16}
                color="var(--mantine-color-dimmed)"
                style={{ flexShrink: 0 }}
              />
            )}
            {convo.unread && <div className={classes.unreadDot} />}
          </Group>
          <Group
            gap="xxxs"
            wrap="nowrap"
            style={{ overflow: "hidden" }}
            maw="100%">
            {time && (
              <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                {time}
              </Text>
            )}
            {time && convo.lastMessage && (
              <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                &bull;
              </Text>
            )}
            {convo.lastMessage && (
              <Text size="sm" c="dimmed" truncate>
                {convo.lastMessage}
              </Text>
            )}
          </Group>
        </Stack>
      </Group>
    </Link>
  );
};
