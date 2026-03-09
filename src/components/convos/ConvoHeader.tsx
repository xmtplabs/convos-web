import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  BellOffIcon,
  EllipsisIcon,
  ImageIcon,
  InfoIcon,
  LockIcon,
  MenuIcon,
  StarIcon,
} from "lucide-react";
import { AddMenu } from "@/components/convos/AddMenu";
import { ConvoMenu } from "@/components/convos/ConvoMenu";
import { LinkActionIcon } from "@/components/shared/Button";
import { useNav } from "@/contexts/NavContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useExplodeCountdown } from "@/hooks/useExplodeCountdown";
import { useIsMobile } from "@/hooks/useMobile";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-header");

export const ConvoHeader: React.FC = () => {
  const { appData, convo, explode, members, permissions, toggleDetails } =
    useConvo();
  const { openNav } = useNav();
  const isMobile = useIsMobile();
  const isPending = convo.status === "pending";
  const explodeCountdown = useExplodeCountdown(convo.expiresAtUnix);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);

  log.trace("render", { convoId: convo.id, name: convo.name });

  return (
    <Group
      align="center"
      justify="space-between"
      gap="xs"
      wrap="nowrap"
      flex="1 1 auto">
      <Group gap="sm" wrap="nowrap" style={{ overflow: "hidden" }}>
        {isMobile && (
          <ActionIcon variant="transparent" onClick={openNav} flex="0 0 auto">
            <MenuIcon size={24} />
          </ActionIcon>
        )}
        <Avatar radius="xl" size="48" flex="0 0 auto" src={groupImage}>
          {groupImage === null && <ImageIcon size={24} />}
        </Avatar>
        <Stack flex="1 1 auto" gap="0" style={{ overflow: "hidden" }}>
          <Group gap={4} align="center" wrap="nowrap">
            {convo.faved && <StarIcon size={16} style={{ flexShrink: 0 }} />}
            <Text fw={500} size="md" truncate>
              {convo.name}
            </Text>
            {explodeCountdown && (
              <Badge
                color="red"
                variant="light"
                size="md"
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
          </Group>
          <Group gap="xxxs" align="center" wrap="nowrap">
            <Text size="xs" c="dimmed" truncate>
              {members.length} member{members.length !== 1 && "s"}
            </Text>
            {convo.description && (
              <>
                <Text size="xs" c="dimmed" truncate>
                  &bull;
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {convo.description}
                </Text>
              </>
            )}
          </Group>
        </Stack>
      </Group>
      {!isPending && (
        <Group align="center" gap="md" flex="0 0 auto">
          {isMobile ? (
            <ActionIcon variant="transparent" onClick={toggleDetails}>
              <InfoIcon size={24} />
            </ActionIcon>
          ) : (
            <ConvoMenu
              convo={convo}
              appData={appData}
              canLock={permissions?.canLock}
              canExplode={permissions?.canRemoveMembers}
              onExplode={explode}>
              <ActionIcon variant="transparent">
                <EllipsisIcon size={24} />
              </ActionIcon>
            </ConvoMenu>
          )}
          {convo.locked && permissions?.canLock && (
            <LinkActionIcon
              variant="transparent"
              to="."
              search={{ action: "unlock" }}
              visibleFrom="sm">
              <LockIcon size={24} />
            </LinkActionIcon>
          )}
          {convo.locked && !permissions?.canLock && (
            <Tooltip
              label={
                <Text size="sm">
                  This Convo is locked.
                  <br />
                  Nobody new can join.
                </Text>
              }
              withArrow>
              <ActionIcon variant="transparent" c="dimmed" visibleFrom="sm">
                <LockIcon size={24} />
              </ActionIcon>
            </Tooltip>
          )}
          {!convo.locked && permissions?.canAddMembers && (
            <AddMenu visibleFrom="sm" />
          )}
          <ActionIcon
            variant="transparent"
            onClick={toggleDetails}
            visibleFrom="sm">
            <InfoIcon size={24} />
          </ActionIcon>
        </Group>
      )}
    </Group>
  );
};
