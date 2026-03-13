import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  EllipsisIcon,
  PlusIcon,
  UserMinusIcon,
} from "lucide-react";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createLogger } from "@/utils/log";

const log = createLogger("members-list");
const MENU_ICON_SIZE = 16;

const MemberListItem: React.FC<{
  convoId: string;
  inboxId: string;
  name?: string;
  isYou: boolean;
  canRemove: boolean;
  onRemove: () => void;
}> = ({ convoId, inboxId, name, isYou, canRemove, onRemove }) => {
  const avatar = useAvatar(convoId, inboxId);
  const displayName = name ?? "Somebody";

  return (
    <GroupedListItem>
      <Avatar size={40} radius="xl" src={avatar}>
        {displayName[0].toUpperCase()}
      </Avatar>
      <Stack gap={0} flex={1} style={{ overflow: "hidden" }}>
        <Text size="sm" truncate>
          {displayName}
        </Text>
        {isYou && (
          <Text size="xs" c="dimmed">
            You
          </Text>
        )}
      </Stack>
      {canRemove && (
        <Menu withArrow position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" radius="xl">
              <EllipsisIcon size={20} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<UserMinusIcon size={MENU_ICON_SIZE} />}
              onClick={onRemove}>
              Remove
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </GroupedListItem>
  );
};

export const MembersList: React.FC<{
  maxDisplay?: number;
}> = ({ maxDisplay = 3 }) => {
  const { convo, members, memberProfiles, permissions, removeMember } =
    useConvo();
  log.trace("render", {
    maxDisplay,
    convoId: convo.id,
    memberCount: members.length,
  });
  const inboxId = useInboxId();
  const navigate = useNavigate();

  const canAddMembers = permissions?.canAddMembers ?? false;
  const canRemoveMembers = permissions?.canRemoveMembers ?? false;
  const sorted = [...members].sort((a, b) => {
    if (a.inboxId === inboxId) return -1;
    if (b.inboxId === inboxId) return 1;
    return 0;
  });
  const displayMembers = sorted.slice(0, maxDisplay);
  const hasMoreMembers = members.length > maxDisplay;

  return (
    <GroupedList
      header={
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed" fw={500} ml="lg">
            {members.length} member{members.length !== 1 && "s"}
          </Text>
          {canAddMembers && hasMoreMembers && (
            <Button
              variant="subtle"
              size="xs"
              radius="lg"
              leftSection={<PlusIcon size={20} />}
              styles={{ section: { marginInlineEnd: 4 } }}
              onClick={() => {
                log.info("invite action clicked", { convoId: convo.id });
                void navigate({
                  to: ".",
                  search: { action: "invite" },
                });
              }}>
              Invite
            </Button>
          )}
        </Group>
      }
      footer={
        hasMoreMembers ? (
          <Group justify="flex-end">
            <Button
              variant="subtle"
              size="xs"
              radius="lg"
              rightSection={<ChevronRightIcon size={16} />}
              styles={{ section: { marginInlineStart: 4 } }}
              onClick={() => {
                void navigate({
                  to: "/convo/$convoId/details/members",
                  params: { convoId: convo.id },
                });
              }}>
              View all members
            </Button>
          </Group>
        ) : undefined
      }>
      {displayMembers.map((member) => {
        const profile = memberProfiles.get(member.inboxId);
        const isYou = member.inboxId === inboxId;
        return (
          <MemberListItem
            key={member.inboxId}
            convoId={convo.id}
            inboxId={member.inboxId}
            name={profile?.name}
            isYou={isYou}
            canRemove={canRemoveMembers && !isYou}
            onRemove={() => {
              log.info("removing member", {
                convoId: convo.id,
                memberInboxId: member.inboxId,
              });
              void removeMember(member.inboxId).catch((err: unknown) => {
                log.error("failed to remove member", err);
              });
            }}
          />
        );
      })}
    </GroupedList>
  );
};
