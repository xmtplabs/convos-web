import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Group as XmtpGroup, type RemoteAttachment } from "@xmtp/browser-sdk";
import { ArrowUpIcon, ImageIcon, UserIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AttachmentPreview } from "@/components/AttachmentPreview";
import { ReplyPreview } from "@/components/ReplyPreview";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { useProfile } from "@/hooks/useProfile";
import { useSendMessage } from "@/hooks/useSendMessage";
import { shareProfileToGroup } from "@/utils/appData";
import { uploadAttachment, validateFile } from "@/utils/attachment";

export const Composer = () => {
  const { convo, conversation, memberProfiles, permissions } = useConvo();
  const {
    reply,
    sendText,
    sendTextReply,
    loading: sending,
    sendRemoteAttachment,
    setReply,
  } = useSendMessage();
  const profile = useProfile();
  const inboxId = useInboxId();
  const groupProfile = memberProfiles.get(inboxId);
  const groupName = groupProfile?.name;
  const groupAvatarSrc = useAvatar(convo.id, inboxId);
  const profileAlreadyShared =
    groupProfile?.name === profile?.name &&
    !!groupProfile?.encryptedImage === !!profile?.avatarUrl;
  const canShareProfile =
    !!profile?.name &&
    !profileAlreadyShared &&
    (permissions?.canUpdateAppData ?? false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remoteAttachmentRef = useRef<RemoteAttachment | null>(null);
  const isSending = sending || uploadingAttachment;
  const hasContent = message.trim() !== "" || attachment;

  const handleShareProfile = useCallback(async () => {
    if (!inboxId || !(conversation instanceof XmtpGroup) || !profile) return;
    setSharingProfile(true);
    try {
      await shareProfileToGroup(conversation, profile, inboxId);
    } catch {
      setError("Failed to share profile");
    } finally {
      setSharingProfile(false);
    }
  }, [inboxId, conversation, profile]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const validation = validateFile(file);
        if (validation.valid) {
          setAttachment(file);
        } else {
          setError(validation.error);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (!hasContent || isSending) return;

    if (attachment) {
      try {
        if (!remoteAttachmentRef.current) {
          setUploadingAttachment(true);
          remoteAttachmentRef.current = await uploadAttachment(attachment);
        }
      } catch {
        setError("Failed to upload attachment");
        return;
      } finally {
        setUploadingAttachment(false);
      }

      try {
        await sendRemoteAttachment(remoteAttachmentRef.current);
        setAttachment(null);
        remoteAttachmentRef.current = null;
      } catch {
        setError("Failed to send attachment");
        return;
      }
    }

    if (message) {
      try {
        if (reply) {
          await sendTextReply(reply.messageId, message);
        } else {
          await sendText(message);
        }
        setMessage("");
      } catch {
        setError("Failed to send message");
        return;
      }
    }

    setReply(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [
    message,
    attachment,
    sending,
    uploadingAttachment,
    reply,
    sendText,
    sendTextReply,
    sendRemoteAttachment,
    setReply,
  ]);

  return (
    <>
      <Box p="md" style={{ width: "100%" }}>
        <Stack gap="xxs">
          {reply && (
            <ReplyPreview
              replyTo={
                memberProfiles.get(reply.senderInboxId)?.name || "Somebody"
              }
              replyMessage={reply.content}
              onCancel={() => {
                setReply(null);
              }}
            />
          )}
          {attachment && (
            <AttachmentPreview
              file={attachment}
              disabled={isSending}
              onCancel={() => {
                setAttachment(null);
              }}
            />
          )}
          <Group gap="xxxs" align="center" w="100%">
            <ActionIcon
              variant="light"
              size="xl"
              radius="xl"
              disabled={isSending}
              onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={20} />
            </ActionIcon>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <TextInput
              variant="filled"
              radius="xl"
              leftSectionPointerEvents={canShareProfile ? "all" : "none"}
              leftSection={
                canShareProfile ? (
                  <Menu withArrow position="top-start">
                    <Menu.Target>
                      <Avatar
                        radius="xl"
                        size={32}
                        src={groupAvatarSrc}
                        style={{ cursor: "pointer" }}>
                        {!groupAvatarSrc &&
                          (groupName ? groupName[0].toUpperCase() : "S")}
                      </Avatar>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<UserIcon size={18} />}
                        disabled={
                          !(conversation instanceof XmtpGroup) || sharingProfile
                        }
                        onClick={() => void handleShareProfile()}>
                        Chat as {profile.name}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                ) : (
                  <Avatar radius="xl" size={32} src={groupAvatarSrc}>
                    {!groupAvatarSrc &&
                      (groupName ? groupName[0].toUpperCase() : "S")}
                  </Avatar>
                )
              }
              rightSection={
                <ActionIcon
                  variant="filled"
                  disabled={!hasContent}
                  loading={isSending}
                  size="md"
                  radius="xl"
                  onClick={() => void handleSend()}>
                  <ArrowUpIcon size={20} />
                </ActionIcon>
              }
              ref={inputRef}
              disabled={isSending}
              size="md"
              placeholder={`Chat as ${groupName ?? "Somebody"}`}
              value={message}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSend();
              }}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              style={{ flex: 1 }}
            />
          </Group>
        </Stack>
      </Box>
      {error && (
        <Modal
          opened
          centered
          withCloseButton={false}
          closeOnEscape={false}
          closeOnClickOutside={false}
          size="auto"
          title="Error"
          onClose={() => {
            setError(null);
          }}>
          <Text ta="center" size="sm">
            {error}
          </Text>
          <Group mt="md" justify="flex-end">
            <Button
              onClick={() => {
                setError(null);
              }}>
              OK
            </Button>
          </Group>
        </Modal>
      )}
    </>
  );
};
