import { Button, Group, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Opfs } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useClient } from "@/hooks/useClient";
import { clearAllAvatars } from "@/utils/avatars";
import { clearConvos } from "@/utils/convos";
import { clearProfiles } from "@/utils/profile";

type DeleteAllDataModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const DeleteAllDataModal: React.FC<DeleteAllDataModalProps> = ({
  opened,
  onClose,
}) => {
  const ctx = useClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      ctx.setConvo(null);
      await clearConvos();
      await clearProfiles();
      await clearAllAvatars();
      const opfs = await Opfs.create();
      await opfs.clearAll();
      const remaining = await opfs.listFiles();
      if (remaining.length > 0) {
        console.error("Failed to clear all OPFS files:", remaining);
      }
      opfs.close();
      void navigate({ to: "/" });
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete all app data">
      <Stack gap="md">
        <Text size="sm">
          This action is permanent and cannot be undone. All conversations,
          messages, and XMTP identities on this machine will be permanently
          destroyed.
        </Text>
        <Group justify="flex-end" gap="xxs">
          <Button
            variant="default"
            radius="xl"
            onClick={onClose}
            disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            radius="xl"
            onClick={() => {
              void handleDelete();
            }}
            loading={deleting}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
