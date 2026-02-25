import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { CheckIcon, TrashIcon, UploadIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useProfile } from "@/hooks/useProfile";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { validateFile } from "@/utils/attachment";
import { uploadAvatar } from "@/utils/avatars";
import { generateKey } from "@/utils/encryption";
import { upsertProfile } from "@/utils/profile";
import classes from "./Quickname.module.css";

type QuicknameProps = {
  onDirtyChange?: (dirty: boolean) => void;
};

export const Quickname: React.FC<QuicknameProps> = ({ onDirtyChange }) => {
  const profile = useProfile();
  const decryptedAvatarSrc = useProfileAvatar(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [avatarCleared, setAvatarCleared] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>("dimmed");

  const previewSrc = avatarCleared
    ? null
    : (pendingPreview ?? decryptedAvatarSrc);

  // Sync state from profile on load/change
  useEffect(() => {
    if (profile) {
      setEditingName(profile.name ?? "");
    }
  }, [profile]);

  const isDirty =
    editingName !== (profile?.name ?? "") ||
    pendingFile !== null ||
    pendingUrl !== null ||
    avatarCleared;

  useLayoutEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      const validation = validateFile(file);
      if (!validation.valid) {
        setStatus(validation.error);
        setStatusColor("red");
        return;
      }
      setStatus(null);
      setPendingFile(file);
      setPendingUrl(null);
      setAvatarCleared(false);
      const url = URL.createObjectURL(file);
      setPendingPreview(url);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const handleRemoveAvatar = useCallback(() => {
    setPendingFile(null);
    setPendingUrl(null);
    setPendingPreview(null);
    setAvatarCleared(true);
    setStatus(null);
  }, []);

  const handleUndo = useCallback(() => {
    setEditingName(profile?.name ?? "");
    setPendingFile(null);
    setPendingUrl(null);
    setPendingPreview(null);
    setAvatarCleared(false);
    setStatus(null);
  }, [profile?.name]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setStatusColor("dimmed");
    setStatus("Saving...");
    try {
      const profileId = profile?.id ?? "default";
      let avatarKey = profile?.avatarKey;
      let avatarUrl = profile?.avatarUrl;
      let avatarSalt = profile?.avatarSalt;
      let avatarNonce = profile?.avatarNonce;

      if (pendingFile ?? pendingUrl) {
        if (!avatarKey) {
          avatarKey = generateKey();
        }

        let imageData: Uint8Array<ArrayBuffer>;
        if (pendingFile) {
          imageData = new Uint8Array(await pendingFile.arrayBuffer());
        } else if (pendingUrl) {
          setStatus("Fetching image...");
          const response = await fetch(pendingUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch image from URL");
          }
          imageData = new Uint8Array(await response.arrayBuffer());
        } else {
          throw new Error("No image data");
        }

        setStatus("Uploading image...");
        const result = await uploadAvatar(imageData, avatarKey);
        avatarUrl = result.url;
        avatarSalt = result.salt;
        avatarNonce = result.nonce;
      } else if (avatarCleared) {
        avatarUrl = undefined;
        avatarSalt = undefined;
        avatarNonce = undefined;
        avatarKey = undefined;
      }

      setStatus("Saving...");
      await upsertProfile({
        id: profileId,
        name: editingName || undefined,
        avatarUrl,
        avatarSalt,
        avatarNonce,
        avatarKey,
      });

      setPendingFile(null);
      setPendingUrl(null);
      setAvatarCleared(false);
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save profile");
      setStatusColor("red");
    } finally {
      setSaving(false);
    }
  };

  const hasAvatar = previewSrc !== null;

  return (
    <Stack gap="xs">
      <TextInput
        variant="filled"
        radius="xl"
        placeholder="Somebody"
        size="md"
        value={editingName}
        onChange={(e) => {
          setEditingName(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && isDirty && !saving) {
            void handleSave();
          }
        }}
        leftSectionPointerEvents="all"
        rightSectionPointerEvents="all"
        leftSection={
          <Menu withArrow position="bottom-start">
            <Menu.Target>
              <Avatar
                className={classes.avatar}
                radius="xl"
                size={32}
                src={previewSrc}>
                {!hasAvatar &&
                  (editingName ? editingName[0].toUpperCase() : "S")}
              </Avatar>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<UploadIcon size={14} />}
                onClick={() => fileInputRef.current?.click()}>
                Upload image
              </Menu.Item>
              {hasAvatar && (
                <Menu.Item
                  color="red"
                  leftSection={<TrashIcon size={14} />}
                  onClick={handleRemoveAvatar}>
                  Remove image
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        }
        rightSection={
          isDirty ? (
            <ActionIcon
              variant="filled"
              radius="xl"
              size="sm"
              onClick={() => {
                void handleSave();
              }}
              loading={saving}>
              <CheckIcon size={14} />
            </ActionIcon>
          ) : undefined
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <Group gap="xs" className={classes.status} px="md">
        <Text size="xs" c={status ? statusColor : "dimmed"}>
          {status ?? (isDirty ? "Unsaved changes" : "")}
        </Text>
        {!status && isDirty && (
          <Text
            size="xs"
            td="underline"
            className={classes.undo}
            onClick={handleUndo}>
            Undo
          </Text>
        )}
      </Group>
    </Stack>
  );
};
