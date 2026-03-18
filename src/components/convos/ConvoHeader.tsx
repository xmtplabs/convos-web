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
  ImageIcon,
  InfoIcon,
  LockIcon,
  MenuIcon,
  StarIcon,
} from "lucide-react";
import { InviteMenu } from "@/components/convos/InviteMenu";
import { LinkActionIcon } from "@/components/shared/Button";
import { UnstyledLink } from "@/components/shared/UnstyledLink";
import { useNav } from "@/contexts/NavContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useConvoDetails } from "@/hooks/useConvoDetails";
import { useExplodeCountdown } from "@/hooks/useExplodeCountdown";
import { useIsMobile } from "@/hooks/useMobile";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-header");

export const ConvoHeader: React.FC = () => {
  const { convo, members, permissions } = useConvo();
  const { toggleDetails } = useConvoDetails(convo.id);
  const { openNav } = useNav();
  const isMobile = useIsMobile();
  const isPending = convo.status === "pending";
  const isCreating = convo.status === "creating";
  const memberCount = members.length || (isCreating ? 1 : null);
  const explodeCountdown = useExplodeCountdown(convo.expiresAtUnix);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);

  log.trace("render", { convoId: convo.id });

  return (
    <Group
      align="center"
      justify="space-between"
      gap="xs"
      wrap="nowrap"
      flex="1 1 auto">
      <Group gap="sm" wrap="nowrap" style={{ overflow: "hidden" }}>
        {isMobile && (
          <ActionIcon
            variant="transparent"
            onClick={openNav}
            flex="0 0 auto"
            radius="xl">
            <MenuIcon size={24} />
          </ActionIcon>
        )}
        <UnstyledLink
          to="/convo/$convoId/details/edit"
          params={{ convoId: convo.id }}
          flex="0 0 auto">
          <Avatar radius="xl" size="48" src={groupImage}>
            {groupImage === null && <ImageIcon size={24} />}
          </Avatar>
        </UnstyledLink>
        <Stack flex="1 1 auto" gap="0" style={{ overflow: "hidden" }}>
          <Group gap={4} align="center" wrap="nowrap">
            {convo.faved && <StarIcon size={16} style={{ flexShrink: 0 }} />}
            <UnstyledLink
              to="/convo/$convoId/details/edit"
              params={{ convoId: convo.id }}
              search={{ focus: "name" }}>
              <Text fw={500} size="md" truncate>
                {convo.name}
              </Text>
            </UnstyledLink>
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
            {memberCount != null ? (
              <UnstyledLink
                to="/convo/$convoId/details/members"
                params={{ convoId: convo.id }}>
                <Text size="xs" c="dimmed" truncate>
                  {memberCount} member{memberCount !== 1 && "s"}
                </Text>
              </UnstyledLink>
            ) : (
              <Text size="xs" c="dimmed">
                &nbsp;
              </Text>
            )}
            {convo.description && (
              <>
                <Text size="xs" c="dimmed" truncate>
                  &bull;
                </Text>
                <UnstyledLink
                  to="/convo/$convoId/details/edit"
                  params={{ convoId: convo.id }}
                  search={{ focus: "description" }}>
                  <Text size="xs" c="dimmed" truncate>
                    {convo.description}
                  </Text>
                </UnstyledLink>
              </>
            )}
          </Group>
        </Stack>
      </Group>
      {!isPending && (
        <Group align="center" gap="md" flex="0 0 auto">
          {convo.locked && permissions?.canLock && (
            <LinkActionIcon
              variant="transparent"
              radius="xl"
              to="."
              search={{ action: "unlock" }}>
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
              <ActionIcon variant="transparent" c="dimmed" radius="xl">
                <LockIcon size={24} />
              </ActionIcon>
            </Tooltip>
          )}
          {!convo.locked && permissions?.canAddMembers && <InviteMenu />}
          <ActionIcon variant="transparent" onClick={toggleDetails} radius="xl">
            <InfoIcon size={24} />
          </ActionIcon>
        </Group>
      )}
    </Group>
  );
};
