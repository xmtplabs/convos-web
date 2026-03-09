import { ActionIcon, Avatar, Group, Stack, Text } from "@mantine/core";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BellIcon,
  BellOffIcon,
  BombIcon,
  EllipsisIcon,
  ImageIcon,
  LockIcon,
  LockOpenIcon,
  MailIcon,
  MailOpenIcon,
  PencilIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { AddMenuItems } from "@/components/convos/AddMenu";
import { ConvoPreferences } from "@/components/convos/ConvoPreferences";
import { EditConvoPanel } from "@/components/convos/EditConvoPanel";
import { ExplodeItems } from "@/components/convos/ExplodeSubMenu";
import { ActionSheet } from "@/components/shared/ActionSheet";
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
  const location = useLocation();
  const groupImage = useAvatar(convo.id, "__group__");

  const canExplode = permissions?.canRemoveMembers ?? false;
  const canLock = permissions?.canLock ?? false;
  const hasActiveTimer = appData?.expiresAtUnix != null;
  const showMembers = location.pathname.endsWith("/details/members");
  const showEdit = location.pathname.endsWith("/details/edit");
  const showSubpage = showMembers || showEdit;

  let headerTitle = "Convo details";
  if (showEdit) headerTitle = "Edit convo";
  else if (showMembers) headerTitle = "All members";

  log.trace("render", {
    convoId: convo.id,
    detailsOpen,
    showMembers,
    showEdit,
  });

  return (
    <div className={classes.panel} data-state={detailsOpen ? "open" : "closed"}>
      <div className={classes.header}>
        {showSubpage && (
          <ActionIcon
            variant="subtle"
            onClick={() =>
              void navigate({
                to: "/convo/$convoId/details",
                params: { convoId: convo.id },
              })
            }>
            <ArrowLeftIcon size={20} />
          </ActionIcon>
        )}
        <Text fw={600} size="lg" className={classes.headerTitle}>
          {headerTitle}
        </Text>
        <ActionIcon variant="subtle" onClick={toggleDetails}>
          <XIcon size={20} />
        </ActionIcon>
      </div>
      <div className={classes.pages}>
        <div
          className={classes.page}
          data-page="details"
          {...(showSubpage ? { "data-offscreen": true } : {})}>
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
              <div className={classes.action}>
                <ActionIcon
                  variant="default"
                  size={48}
                  radius="xl"
                  onClick={() => {
                    log.info(convo.muted ? "unmute" : "mute", {
                      convoId: convo.id,
                    });
                    void updateConvo(convo.id, { muted: !convo.muted });
                  }}>
                  {convo.muted ? (
                    <BellOffIcon size={20} />
                  ) : (
                    <BellIcon size={20} />
                  )}
                </ActionIcon>
                <Text size="xs">{convo.muted ? "Unmute" : "Mute"}</Text>
              </div>
              {canExplode && (
                <div className={classes.action}>
                  <ActionSheet withArrow position="bottom">
                    <ActionSheet.Target>
                      <ActionIcon variant="default" size={48} radius="xl">
                        <BombIcon
                          size={20}
                          color="var(--mantine-color-red-6)"
                        />
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
                          convo.unread
                            ? "mark read clicked"
                            : "mark unread clicked",
                          { convoId: convo.id },
                        );
                        void updateConvo(convo.id, { unread: !convo.unread });
                      }}>
                      {convo.unread ? "Mark as read" : "Mark as unread"}
                    </ActionSheet.Item>
                    {!convo.locked && permissions?.canAddMembers && (
                      <>
                        <ActionSheet.ItemDivider />
                        <AddMenuItems />
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
            <MembersList />
            <ConvoPreferences />
          </Stack>
        </div>
        <div
          className={classes.page}
          data-page="members"
          {...(showMembers ? {} : { "data-offscreen": true })}>
          <MembersList maxDisplay={Infinity} />
        </div>
        <div
          className={classes.page}
          data-page="edit"
          {...(showEdit ? {} : { "data-offscreen": true })}>
          <EditConvoPanel
            onDone={() =>
              void navigate({
                to: "/convo/$convoId/details",
                params: { convoId: convo.id },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
