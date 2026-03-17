import { Avatar, Group, Text } from "@mantine/core";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { formatDuration } from "@/utils/time";
import classes from "./MessageList.module.css";

export type ExplodeNotificationProps = {
  initiatorInboxId: string;
  sentAtNs: bigint;
  expiresAtUnix: number;
};

export const ExplodeNotification: React.FC<ExplodeNotificationProps> = ({
  initiatorInboxId,
  sentAtNs,
  expiresAtUnix,
}) => {
  const { convo, memberProfiles } = useConvo();
  const inboxId = useInboxId();
  const src = useAvatar(convo.id, initiatorInboxId);
  const profile = memberProfiles.get(initiatorInboxId);
  const isYou = initiatorInboxId === inboxId;
  const name = isYou ? "You" : (profile?.name ?? "Somebody");

  const sentMs = Number(sentAtNs / 1_000_000n);
  const durationMs = expiresAtUnix * 1000 - sentMs;
  const durationText = formatDuration(durationMs);

  return (
    <div className={`${classes.item} ${classes.systemMessage}`}>
      <Group gap={4} justify="center" align="center">
        <Avatar size={20} radius="xl" src={src}>
          {!src && (profile?.name ? profile.name[0].toUpperCase() : "S")}
        </Avatar>
        <Text size="xs" c="dimmed">
          {name} set this convo to explode in {durationText}
        </Text>
      </Group>
    </div>
  );
};
