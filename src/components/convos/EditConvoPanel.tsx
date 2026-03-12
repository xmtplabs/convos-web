import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import {
  ImageIcon,
  ImageMinusIcon,
  ImagePlusIcon,
  ImageUpIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { removeGroupImage, updateGroupImage } from "@/utils/appData";
import { validateFile } from "@/utils/attachment";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("edit-convo");

export const EditConvoPanel: React.FC = () => {
  const { convo, conversation, permissions, sync } = useConvo();
  const canEditName = permissions?.canEditName ?? false;
  const canEditDescription = permissions?.canEditDescription ?? false;
  const canEditImage = permissions?.canEditImage ?? false;
  const [name, setName] = useState(convo.name ?? "");
  const [description, setDescription] = useState(convo.description ?? "");
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const { focus } = useSearch({
    strict: false,
  });

  useEffect(() => {
    if (!focus) return;
    switch (focus) {
      case "name":
        nameRef.current?.focus({ preventScroll: true });
        nameRef.current?.select();
        break;
      case "description":
        descriptionRef.current?.focus({ preventScroll: true });
        descriptionRef.current?.select();
        break;
    }
  }, [focus, canEditImage]);

  log.trace("render", { convoId: convo.id, saving, imageLoading });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        log.debug("no file chosen");
        return;
      }
      log.info("file chosen", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      e.target.value = "";

      const validation = validateFile(file);
      if (!validation.valid) {
        log.warn("validation failed", { name: file.name });
        setImageError(
          "Invalid file. Please choose a JPEG, PNG, GIF, or WebP image.",
        );
        return;
      }

      if (!(conversation instanceof XmtpGroup)) {
        log.debug("not a group conversation");
        return;
      }

      setImageLoading(true);
      try {
        log.info("uploading group image", { convoId: convo.id });
        const imageData = new Uint8Array(await file.arrayBuffer());
        await updateGroupImage(conversation, imageData);
        await sync();
        log.info("upload complete", { convoId: convo.id });
      } catch (err) {
        log.error("upload failed", err);
        setImageError("Failed to upload image. Please try again.");
      } finally {
        setImageLoading(false);
      }
    },
    [conversation, sync, convo.id],
  );

  const handleRemoveImage = useCallback(async () => {
    log.info("removing group image", { convoId: convo.id });
    if (!(conversation instanceof XmtpGroup)) {
      log.debug("not a group conversation");
      return;
    }
    setImageLoading(true);
    try {
      await removeGroupImage(conversation);
      await sync();
      log.info("image removed", { convoId: convo.id });
    } catch (err) {
      log.error("remove failed", err);
      setImageError("Failed to remove image. Please try again.");
    } finally {
      setImageLoading(false);
    }
  }, [conversation, sync, convo.id]);

  const hasChanges =
    name !== (convo.name ?? "") || description !== (convo.description ?? "");

  const handleSave = async () => {
    if (!(conversation instanceof XmtpGroup)) {
      log.debug("save skipped, not a group", { convoId: convo.id });
      return;
    }
    log.info("save started", {
      convoId: convo.id,
      canEditName,
      canEditDescription,
    });
    setSaving(true);
    try {
      if (canEditName && name !== (convo.name ?? "")) {
        await conversation.updateName(name);
      }
      if (canEditDescription && description !== (convo.description ?? "")) {
        await conversation.updateDescription(description);
      }
      void updateConvo(convo.id, {
        name: name || undefined,
        description: description || undefined,
      });
      log.info("save succeeded", { convoId: convo.id });
    } catch (err) {
      log.error("save failed", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Stack align="center" gap="xs">
        <Box pos="relative">
          <Avatar radius="100%" size="140" src={groupImage}>
            {groupImage === null && <ImageIcon size={64} />}
          </Avatar>
          {imageLoading && (
            <Box
              pos="absolute"
              style={{
                inset: 0,
                borderRadius: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Loader size={32} color="white" />
            </Box>
          )}
        </Box>
        {canEditImage && (
          <Group gap="md">
            {groupImage === null ? (
              <Stack
                align="center"
                gap="xxxs"
                miw={48}
                style={{ cursor: "pointer" }}
                onClick={() => !imageLoading && fileInputRef.current?.click()}>
                <ActionIcon
                  variant="default"
                  size={48}
                  radius="xl"
                  disabled={imageLoading}>
                  <ImagePlusIcon size={20} />
                </ActionIcon>
                <Text size="xs" c="dimmed">
                  Add photo
                </Text>
              </Stack>
            ) : (
              <>
                <Stack
                  align="center"
                  gap="xxxs"
                  miw={48}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    !imageLoading && fileInputRef.current?.click()
                  }>
                  <ActionIcon
                    variant="default"
                    size={48}
                    radius="xl"
                    disabled={imageLoading}>
                    <ImageUpIcon size={20} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">
                    Change
                  </Text>
                </Stack>
                <Stack
                  align="center"
                  gap="xxxs"
                  miw={48}
                  style={{ cursor: "pointer" }}
                  onClick={() => !imageLoading && void handleRemoveImage()}>
                  <ActionIcon
                    variant="default"
                    size={48}
                    radius="xl"
                    disabled={imageLoading}>
                    <ImageMinusIcon size={20} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">
                    Remove
                  </Text>
                </Stack>
              </>
            )}
          </Group>
        )}
      </Stack>
      <TextInput
        ref={nameRef}
        label="Name"
        size="md"
        disabled={!canEditName}
        value={name}
        onChange={(e) => {
          setName(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hasChanges) {
            void handleSave();
          }
          if (e.key === "Escape") {
            setName(convo.name ?? "");
          }
        }}
      />
      <TextInput
        ref={descriptionRef}
        label="Description"
        description="Descriptions are optional"
        size="md"
        disabled={!canEditDescription}
        value={description}
        onChange={(e) => {
          setDescription(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hasChanges) {
            void handleSave();
          }
          if (e.key === "Escape") {
            setDescription(convo.description ?? "");
          }
        }}
      />
      <Button
        variant="filled"
        size="lg"
        radius="lg"
        onClick={() => {
          void handleSave();
        }}
        loading={saving}
        disabled={!hasChanges}>
        Save
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={(e) => void handleFileSelect(e)}
      />
      {imageError !== null && (
        <Modal
          onClose={() => {
            setImageError(null);
          }}
          title="Image Error">
          <Stack gap="md">
            <Text size="sm">{imageError}</Text>
            <ModalCloseButton>OK</ModalCloseButton>
          </Stack>
        </Modal>
      )}
    </Stack>
  );
};
