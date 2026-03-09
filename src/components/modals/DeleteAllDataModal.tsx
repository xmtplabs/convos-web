import { Button, Stack, Text } from "@mantine/core";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Opfs } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useClient } from "@/hooks/useClient";
import { clearAllAvatars } from "@/utils/avatars";
import { clearConvos } from "@/utils/convos";
import { createLogger } from "@/utils/log";
import { clearProfiles } from "@/utils/profile";

const log = createLogger("delete-all-data");

export const DeleteAllDataModal: React.FC = () => {
  const ctx = useClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  const handleDelete = async () => {
    log.trace("handleDelete");
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
        log.error("failed to clear all OPFS files", { remaining });
      }
      opfs.close();
      log.info("all data deleted");
      void navigate({ to: "/" });
    } catch (err) {
      log.error("deleteAllData failed", err);
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Delete all app data">
      <Stack gap="md">
        <Text size="sm">
          This action is permanent and cannot be undone. All conversations,
          messages, and XMTP identities on this machine will be permanently
          destroyed.
        </Text>
        <Stack gap="xxs">
          <Button
            variant="filled"
            size="lg"
            radius="lg"
            color="red"
            onClick={() => {
              void handleDelete();
            }}
            loading={deleting}>
            Delete
          </Button>
          <ModalCloseButton disabled={deleting}>Cancel</ModalCloseButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
