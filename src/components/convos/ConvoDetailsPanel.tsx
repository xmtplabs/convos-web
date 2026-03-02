import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import {
  BombIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ImageIcon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
  UserMinusIcon,
  XIcon,
} from "lucide-react";
import { ExplodeMenuItems } from "@/components/convos/ExplodeSubMenu";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";
import classes from "./ConvoDetailsPanel.module.css";

const log = createLogger("convo-details");

const MENU_ICON_SIZE = 16;

export const ConvoDetailsPanel: React.FC = () => {
  const {
    appData,
    convo,
    conversation,
    detailsOpen,
    explode,
    members,
    memberProfiles,
    permissions,
    toggleDetails,
  } = useConvo();
  const navigate = useNavigate();
  const inboxId = useInboxId();
  const groupImage = useAvatar(convo.id, "__group__");

  const canExplode = permissions?.canRemoveMembers ?? false;
  const canRemoveMembers = permissions?.canRemoveMembers ?? false;
  const canLock = permissions?.canLock ?? false;
  const canAddMembers = permissions?.canAddMembers ?? false;
  const hasActiveTimer = appData?.expiresAtUnix != null;

  log.trace("render", { convoId: convo.id, detailsOpen });

  const displayMembers = members.slice(0, 3);
  const hasMoreMembers = members.length > 3;

  return (
    <div className={classes.panel} data-state={detailsOpen ? "open" : "closed"}>
      <div className={classes.header}>
        <Text fw={600} size="lg">
          Convo details
        </Text>
        <ActionIcon variant="subtle" onClick={toggleDetails}>
          <XIcon size={20} />
        </ActionIcon>
      </div>
      <div className={classes.content}>
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <Avatar radius="100%" size="140" src={groupImage}>
              {groupImage === null && <ImageIcon size={64} />}
            </Avatar>
            <Text size="xxl" fw={600} ta="center" truncate maw="100%">
              {convo.name}
            </Text>
            {convo.description && (
              <Text size="sm" c="dimmed" ta="center" truncate maw="100%">
                {convo.description}
              </Text>
            )}
          </Stack>
          <Group justify="center" gap="md">
            <div className={classes.action}>
              <ActionIcon
                variant="default"
                size={48}
                radius="xl"
                onClick={() =>
                  void navigate({
                    to: ".",
                    search: { action: "edit" },
                  })
                }>
                <PencilIcon size={20} />
              </ActionIcon>
              <Text size="xs" c="dimmed">
                Edit
              </Text>
            </div>
            <div className={classes.action}>
              <ActionIcon
                variant="default"
                size={48}
                radius="xl"
                onClick={() => {
                  log.info(convo.faved ? "unfav" : "fav", {
                    convoId: convo.id,
                  });
                  void updateConvo(convo.id, { faved: !convo.faved });
                }}>
                {convo.faved ? (
                  <StarOffIcon size={20} />
                ) : (
                  <StarIcon size={20} />
                )}
              </ActionIcon>
              <Text size="xs" c="dimmed">
                {convo.faved ? "Unfav" : "Fav"}
              </Text>
            </div>
            {canExplode && (
              <div className={classes.action}>
                <Menu withArrow position="bottom">
                  <Menu.Target>
                    <ActionIcon variant="default" size={48} radius="xl">
                      <BombIcon size={20} color="var(--mantine-color-red-6)" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {!hasActiveTimer && (
                      <ExplodeMenuItems
                        onExplode={explode}
                        onChooseDateTime={() => {
                          void navigate({
                            to: "/convo/$convoId/explode",
                            params: { convoId: convo.id },
                          });
                        }}
                      />
                    )}
                    {hasActiveTimer && (
                      <Menu.Item
                        color="red"
                        leftSection={<BombIcon size={MENU_ICON_SIZE} />}
                        onClick={() => {
                          log.info("explode now", { convoId: convo.id });
                          explode(() => new Date(), true);
                        }}>
                        Explode now
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
                <Text size="xs" c="red">
                  Explode
                </Text>
              </div>
            )}
            {(canLock || canExplode) && (
              <div className={classes.action}>
                <Menu withArrow position="bottom">
                  <Menu.Target>
                    <ActionIcon variant="default" size={48} radius="xl">
                      <EllipsisIcon size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {canLock && (
                      <Menu.Item
                        leftSection={
                          convo.locked ? (
                            <LockOpenIcon size={MENU_ICON_SIZE} />
                          ) : (
                            <LockIcon size={MENU_ICON_SIZE} />
                          )
                        }
                        onClick={() => {
                          void navigate({
                            to: `/convo/${convo.id}/${convo.locked ? "unlock" : "lock"}`,
                          });
                        }}>
                        {convo.locked ? "Unlock" : "Lock"}
                      </Menu.Item>
                    )}
                    <Menu.Item
                      color="red"
                      leftSection={<Trash2Icon size={MENU_ICON_SIZE} />}
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
                <Text size="xs" c="dimmed">
                  More
                </Text>
              </div>
            )}
          </Group>
          <Stack gap="xxxs">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed" fw={500} ml="md">
                {members.length} member{members.length !== 1 && "s"}
              </Text>
              {canAddMembers && (
                <Button
                  variant="subtle"
                  size="xs"
                  radius="lg"
                  leftSection={<PlusIcon size={20} />}
                  styles={{ section: { marginInlineEnd: 4 } }}
                  onClick={() =>
                    void navigate({
                      to: ".",
                      search: { action: "invite" },
                    })
                  }>
                  Add member
                </Button>
              )}
            </Group>
            <Paper radius="md" bg="white" p={0}>
              <Stack gap={0}>
                {displayMembers.map((member) => {
                  const profile = memberProfiles.get(member.inboxId);
                  const isYou = member.inboxId === inboxId;
                  return (
                    <MemberRow
                      key={member.inboxId}
                      convoId={convo.id}
                      inboxId={member.inboxId}
                      name={profile?.name}
                      isYou={isYou}
                      canRemove={canRemoveMembers && !isYou}
                      onRemove={() => {
                        if (!(conversation instanceof XmtpGroup)) return;
                        log.info("removing member", {
                          convoId: convo.id,
                          memberInboxId: member.inboxId,
                        });
                        void conversation
                          .removeMembers([member.inboxId])
                          .catch((err: unknown) => {
                            log.error("failed to remove member", err);
                          });
                      }}
                    />
                  );
                })}
                {hasMoreMembers && (
                  <Box className={classes.memberRow} py="xs">
                    <Group justify="space-between" flex={1}>
                      <Text size="sm" c="dimmed">
                        View all members
                      </Text>
                      <ChevronRightIcon
                        size={16}
                        color="var(--mantine-color-dimmed)"
                      />
                    </Group>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </div>
    </div>
  );
};

const MemberRow: React.FC<{
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
    <div className={classes.memberRow}>
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
    </div>
  );
};
