import { Avatar, Group, Menu, Stack, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BellOffIcon,
  EyeOffIcon,
  ImageIcon,
  PinIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Convo } from "@/db";
import { useAvatar } from "@/hooks/useAvatar";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import classes from "./ConvoCard.module.css";

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

export type ConvoCardProps = {
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

const ICON_SIZE = 16;

export const ConvoCard: React.FC<ConvoCardProps> = ({ convo, selected }) => {
  const time = useRelativeTime(convo);
  const navigate = useNavigate();
  const [menuOpened, setMenuOpened] = useState(false);
  const [crossAxis, setCrossAxis] = useState(0);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);

  return (
    <Menu
      opened={menuOpened}
      onChange={(opened) => {
        if (!opened) {
          setMenuOpened(false);
        }
      }}
      withArrow
      arrowPosition="side"
      arrowOffset={14}
      position="bottom-start"
      offset={{ mainAxis: 8, crossAxis: crossAxis - 14 }}>
      <Menu.Target>
        <Link
          className={classes.link}
          to={`/convo/$convoId`}
          params={{ convoId: convo.id }}
          onContextMenu={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            setCrossAxis(e.clientX - rect.left);
            setMenuOpened(true);
          }}>
          <Group
            data-selected={selected || undefined}
            gap="xs"
            align="center"
            className={classes.root}>
            <Avatar radius="xl" size="md" flex="0 0 auto" src={groupImage}>
              {!groupImage && <ImageIcon size={16} />}
            </Avatar>
            <Stack flex="1 1 auto" gap="0" align="flex-start">
              <Text truncate>{convo.name}</Text>
              <Text size="xs" c="dimmed" truncate>
                {time}
              </Text>
            </Stack>
          </Group>
        </Link>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<PinIcon size={ICON_SIZE} />}>Pin</Menu.Item>
        <Menu.Item leftSection={<EyeOffIcon size={ICON_SIZE} />}>
          Mark as Unread
        </Menu.Item>
        <Menu.Item leftSection={<BellOffIcon size={ICON_SIZE} />}>
          Mute
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<Trash2Icon size={ICON_SIZE} />}
          onClick={() => {
            void navigate({
              to: "/convo/$convoId/delete",
              params: { convoId: convo.id },
            });
          }}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
