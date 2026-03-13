import { ActionIcon, Group, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
  BombIcon,
  EllipsisIcon,
  LockIcon,
  LockOpenIcon,
  MailIcon,
  MailOpenIcon,
  PencilIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";
import { ExplodeItems } from "@/components/convos/ExplodeSubMenu";
import { InviteMenuItems } from "@/components/convos/InviteMenu";
import { ActionSheet } from "@/components/shared/ActionSheet";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";
import classes from "./ConvoDetailsPanel.module.css";

const log = createLogger("convo-details");

const MENU_ICON_SIZE = 16;

export const ConvoDetailsActions: React.FC = () => {
  const { appData, convo, explode, permissions, toggleFaved, toggleUnread } =
    useConvo();
  const navigate = useNavigate();

  const canExplode = permissions?.canRemoveMembers ?? false;
  const canLock = permissions?.canLock ?? false;
  const hasActiveTimer = appData?.expiresAtUnix != null;

  return (
    <Group justify="center" gap="md">
      <div className={classes.action}>
        <ActionIcon
          variant="default"
          size={48}
          radius="xl"
          onClick={() =>
            void navigate({
              to: "/convo/$convoId/details/edit",
              params: { convoId: convo.id },
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
            toggleFaved();
          }}>
          {convo.faved ? <StarOffIcon size={20} /> : <StarIcon size={20} />}
        </ActionIcon>
        <Text size="xs">{convo.faved ? "Unfav" : "Fav"}</Text>
      </div>
      {canExplode && (
        <div className={classes.action}>
          <ActionSheet withArrow position="bottom">
            <ActionSheet.Target>
              <ActionIcon variant="default" size={48} radius="xl">
                <BombIcon size={20} color="var(--mantine-color-red-6)" />
              </ActionIcon>
            </ActionSheet.Target>
            <ActionSheet.Dropdown>
              {!hasActiveTimer && (
                <ExplodeItems
                  onExplode={explode}
                  onChooseDateTime={() => {
                    void navigate({
                      to: ".",
                      search: { action: "explode" },
                    });
                  }}
                />
              )}
              {hasActiveTimer && (
                <ActionSheet.Item
                  color="red"
                  leftSection={<BombIcon size={MENU_ICON_SIZE} />}
                  onClick={() => {
                    log.info("explode now", { convoId: convo.id });
                    explode(() => new Date(), true);
                  }}>
                  Explode now
                </ActionSheet.Item>
              )}
            </ActionSheet.Dropdown>
          </ActionSheet>
          <Text size="xs" c="red">
            Explode
          </Text>
        </div>
      )}
      <div className={classes.action}>
        <ActionSheet withArrow position="bottom">
          <ActionSheet.Target>
            <ActionIcon variant="default" size={48} radius="xl">
              <EllipsisIcon size={20} />
            </ActionIcon>
          </ActionSheet.Target>
          <ActionSheet.Dropdown>
            <ActionSheet.Item
              leftSection={
                convo.unread ? (
                  <MailOpenIcon size={MENU_ICON_SIZE} />
                ) : (
                  <MailIcon size={MENU_ICON_SIZE} />
                )
              }
              onClick={() => {
                log.info(
                  convo.unread ? "mark read clicked" : "mark unread clicked",
                  { convoId: convo.id },
                );
                toggleUnread();
              }}>
              {convo.unread ? "Mark as read" : "Mark as unread"}
            </ActionSheet.Item>
            {!convo.locked && permissions?.canAddMembers && (
              <>
                <ActionSheet.ItemDivider />
                <InviteMenuItems />
              </>
            )}
            {canLock && (
              <>
                <ActionSheet.ItemDivider />
                <ActionSheet.Item
                  leftSection={
                    convo.locked ? (
                      <LockOpenIcon size={MENU_ICON_SIZE} />
                    ) : (
                      <LockIcon size={MENU_ICON_SIZE} />
                    )
                  }
                  onClick={() => {
                    void navigate({
                      to: ".",
                      search: {
                        action: convo.locked ? "unlock" : "lock",
                      },
                    });
                  }}>
                  {convo.locked ? "Unlock" : "Lock"}
                </ActionSheet.Item>
              </>
            )}
            <ActionSheet.ItemDivider />
            <ActionSheet.Item
              color="red"
              leftSection={<Trash2Icon size={MENU_ICON_SIZE} />}
              onClick={() => {
                void navigate({
                  to: ".",
                  search: { action: "delete" },
                });
              }}>
              Delete
            </ActionSheet.Item>
          </ActionSheet.Dropdown>
        </ActionSheet>
        <Text size="xs">More</Text>
      </div>
    </Group>
  );
};
