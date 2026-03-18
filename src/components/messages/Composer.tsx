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
import type { RemoteAttachment } from "@xmtp/browser-sdk";
import { ArrowUpIcon, ImageIcon, UserIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { useProfile } from "@/hooks/useProfile";
import { uploadAttachment, validateFile } from "@/utils/attachment";
import { createLogger } from "@/utils/log";
import { AttachmentPreview } from "./AttachmentPreview";
import { ReplyPreview } from "./ReplyPreview";

const log = createLogger("composer");

export const Composer = () => {
  const { convo, ready, memberProfiles, permissions, shareProfile } =
    useConvo();
  const {
    reply,
    sendText,
    sendTextReply,
    sending,
    sendRemoteAttachment,
    setReply,
  } = useConvoMessaging();
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
  const isSending = !ready || sending || uploadingAttachment;
  const hasContent = message.trim() !== "" || attachment;

  log.trace("render", {
    convoId: convo.id,
    hasContent,
    isSending,
    hasReply: !!reply,
    hasAttachment: !!attachment,
  });

  useEffect(() => {
    if (reply) {
      log.debug("reply focus effect triggered", {
        replyMessageId: reply.messageId,
      });
      inputRef.current?.focus();
    }
  }, [reply]);

  const handleShareProfile = useCallback(async () => {
    log.info("handleShareProfile start");
    if (!inboxId || !profile) {
      log.debug("handleShareProfile skipped: missing prerequisites", {
        hasInboxId: !!inboxId,
        hasProfile: !!profile,
      });
      return;
    }
    setSharingProfile(true);
    try {
      await shareProfile(profile, inboxId);
      log.info("handleShareProfile success");
    } catch (err) {
      log.error("handleShareProfile failed", err);
      setError("Failed to share profile");
    } finally {
      setSharingProfile(false);
    }
  }, [inboxId, shareProfile, profile]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        log.info("handleFileSelect: file chosen", {
          size: file.size,
          type: file.type,
        });
        const validation = validateFile(file);
        if (validation.valid) {
          log.debug("handleFileSelect: validation passed");
          setAttachment(file);
        } else {
          log.warn("handleFileSelect: validation failed", {
            error: validation.error,
          });
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
    log.info("handleSend start", {
      hasContent,
      hasAttachment: !!attachment,
      hasReply: !!reply,
    });
    if (!hasContent || isSending) {
      log.debug("handleSend skipped", { hasContent, isSending });
      return;
    }

    if (attachment) {
      try {
        if (!remoteAttachmentRef.current) {
          log.info("handleSend: uploading attachment", {
            size: attachment.size,
          });
          setUploadingAttachment(true);
          remoteAttachmentRef.current = await uploadAttachment(attachment);
          log.info("handleSend: attachment uploaded");
        }
      } catch (err) {
        log.error("handleSend: attachment upload failed", err);
        setError("Failed to upload attachment");
        return;
      } finally {
        setUploadingAttachment(false);
      }

      try {
        log.info("handleSend: sending remote attachment");
        await sendRemoteAttachment(remoteAttachmentRef.current);
        setAttachment(null);
        remoteAttachmentRef.current = null;
        log.info("handleSend: remote attachment sent");
      } catch (err) {
        log.error("handleSend: send attachment failed", err);
        setError("Failed to send attachment");
        return;
      }
    }

    if (message) {
      try {
        if (reply) {
          log.info("handleSend: sending reply", {
            replyMessageId: reply.messageId,
          });
          await sendTextReply(reply.messageId, message);
        } else {
          log.info("handleSend: sending text");
          await sendText(message);
        }
        setMessage("");
        log.info("handleSend: text sent");
      } catch (err) {
        log.error("handleSend: send text failed", err);
        setError("Failed to send message");
        return;
      }
    }

    setReply(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [
    message,
    attachment,
    reply,
    sendText,
    sendTextReply,
    sendRemoteAttachment,
    setReply,
    hasContent,
    isSending,
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
                log.info("cancel reply", { replyMessageId: reply.messageId });
                setReply(null);
              }}
            />
          )}
          {attachment && (
            <AttachmentPreview
              file={attachment}
              disabled={isSending}
              onCancel={() => {
                log.info("cancel attachment");
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
                        disabled={sharingProfile}
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
                if (e.key === "Enter") {
                  void handleSend();
                }
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
            log.info("error modal dismissed (close)", { error });
            setError(null);
          }}>
          <Text ta="center" size="sm">
            {error}
          </Text>
          <Group mt="md" justify="flex-end">
            <Button
              onClick={() => {
                log.info("error modal dismissed (OK)", { error });
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
