import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import {
  EllipsisIcon,
  ImageIcon,
  InfoIcon,
  LockIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useRef } from "react";
import { ConvoMenu } from "@/components/convos/ConvoMenu";
import { LinkActionIcon } from "@/components/shared/Button";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { removeGroupImage, updateGroupImage } from "@/utils/appData";
import { validateFile } from "@/utils/attachment";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";

export const ConvoHeader: React.FC = () => {
  const { convo, conversation, members, permissions, sync } = useConvo();
  const isPending = convo.status === "pending";
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      e.target.value = "";

      const validation = validateFile(file);
      if (!validation.valid) {
        return;
      }

      if (!(conversation instanceof XmtpGroup)) {
        return;
      }

      const imageData = new Uint8Array(await file.arrayBuffer());
      await updateGroupImage(conversation, imageData);
      await sync();
    },
    [conversation, sync],
  );

  const handleRemoveImage = useCallback(async () => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }
    await removeGroupImage(conversation);
    await sync();
  }, [conversation, sync]);
  const hasImage = groupImage !== null;
  const canManageImage = !isPending && (permissions?.canEditImage ?? false);

  const avatarElement = (
    <Avatar radius="xl" size="48" flex="0 0 auto" src={groupImage}>
      {!hasImage && <ImageIcon size={24} />}
    </Avatar>
  );

  return (
    <Group
      align="center"
      justify="space-between"
      gap="xs"
      wrap="nowrap"
      flex="1 1 auto">
      <Group gap="sm" wrap="nowrap" style={{ overflow: "hidden" }}>
        {canManageImage ? (
          <Menu withArrow position="bottom-start">
            <Menu.Target>
              <ActionIcon
                variant="transparent"
                radius="xl"
                size={38}
                style={{ padding: 0 }}>
                {avatarElement}
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<UploadIcon size={14} />}
                onClick={() => fileInputRef.current?.click()}>
                Upload image
              </Menu.Item>
              {hasImage && (
                <Menu.Item
                  color="red"
                  leftSection={<TrashIcon size={14} />}
                  onClick={() => void handleRemoveImage()}>
                  Remove image
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        ) : (
          avatarElement
        )}
        <Stack flex="1 1 auto" gap="0" style={{ overflow: "hidden" }}>
          <Group gap={4} align="center" wrap="nowrap">
            {convo.faved && <StarIcon size={16} style={{ flexShrink: 0 }} />}
            <Text fw={500} size="md" truncate flex="1 1 auto">
              {convo.name}
            </Text>
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
          <ConvoMenu convo={convo} canLock={permissions?.canLock}>
            <ActionIcon variant="transparent">
              <EllipsisIcon size={24} />
            </ActionIcon>
          </ConvoMenu>
          {convo.locked ? (
            <Tooltip
              label={
                <Text size="sm">
                  This Convo is locked.
                  <br />
                  Nobody new can join.
                </Text>
              }
              withArrow>
              <ActionIcon variant="transparent" c="dimmed">
                <LockIcon size={24} />
              </ActionIcon>
            </Tooltip>
          ) : (
            permissions?.canAddMembers && (
              <LinkActionIcon
                variant="transparent"
                to="/convo/$convoId/invite"
                params={{ convoId: convo.id }}>
                <ShareIcon size={24} />
              </LinkActionIcon>
            )
          )}
          <LinkActionIcon
            variant="transparent"
            to="/convo/$convoId/details"
            params={{ convoId: convo.id }}>
            <InfoIcon size={24} />
          </LinkActionIcon>
        </Group>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={(e) => void handleFileSelect(e)}
      />
    </Group>
  );
};
