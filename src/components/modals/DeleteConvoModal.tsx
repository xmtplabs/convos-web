import { Button, Group, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Opfs } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useClient } from "@/hooks/useClient";
import { useInboxId } from "@/hooks/useInboxId";
import { Route } from "@/routes/_app/convo/$convoId";
import { clearAvatars } from "@/utils/avatars";
import { deleteConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("db");

type DeleteConvoModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const DeleteConvoModal: React.FC<DeleteConvoModalProps> = ({
  opened,
  onClose,
}) => {
  const convo = Route.useLoaderData();
  const ctx = useClient();
  const inboxId = useInboxId();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    log.trace("deleteConvoData", { convoId: convo.id });
    setDeleting(true);
    try {
      ctx.setConvo(null);
      await deleteConvo(convo.id);
      await clearAvatars(convo.id);
      if (inboxId) {
        const dbPath = `xmtp-local-${inboxId}.db3`;
        const opfs = await Opfs.create();
        await opfs.deleteFile(dbPath);
        const remaining = await opfs.listFiles();
        if (remaining.includes(dbPath)) {
          log.error("failed to delete OPFS database", { dbPath });
        }
        opfs.close();
      }
      log.info("convo data deleted", { convoId: convo.id });
      void navigate({ to: "/" });
    } catch (err) {
      log.error("deleteConvoData failed", err);
      setDeleting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete conversation"
      withCloseButton={false}>
      <Stack gap="md">
        <Text size="sm">
          This action is permanent and cannot be undone. All conversation data
          on this machine will be lost and the XMTP identity for this
          conversation will be destroyed.
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
