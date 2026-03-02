import { ActionIcon, Avatar, Group, Menu, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
  BombIcon,
  EllipsisIcon,
  ImageIcon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { AddMenuItems } from "@/components/convos/AddMenu";
import { ExplodeMenuItems } from "@/components/convos/ExplodeSubMenu";
import { MembersList } from "@/components/shared/MembersList";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";
import classes from "./ConvoDetailsPanel.module.css";

const log = createLogger("convo-details");

const MENU_ICON_SIZE = 16;

export const ConvoDetailsPanel: React.FC = () => {
  const { appData, convo, detailsOpen, explode, permissions, toggleDetails } =
    useConvo();
  const navigate = useNavigate();
  const groupImage = useAvatar(convo.id, "__group__");

  const canExplode = permissions?.canRemoveMembers ?? false;
  const canLock = permissions?.canLock ?? false;
  const hasActiveTimer = appData?.expiresAtUnix != null;

  log.trace("render", { convoId: convo.id, detailsOpen });

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
              <Text size="xs">Edit</Text>
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
              <Text size="xs">{convo.faved ? "Unfav" : "Fav"}</Text>
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
                    <AddMenuItems />
                    <Menu.Divider />
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
                <Text size="xs">More</Text>
              </div>
            )}
          </Group>
          <MembersList />
        </Stack>
      </div>
    </div>
  );
};
