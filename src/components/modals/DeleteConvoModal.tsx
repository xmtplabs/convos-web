import { Button, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Opfs } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { Route } from "@/routes/_app/convo/$convoId";
import { clearAvatars } from "@/utils/avatars";
import { deleteConvo } from "@/utils/db";
import { createLogger } from "@/utils/log";
import { unregisterConvo } from "@/utils/notifications";

const log = createLogger("db");

type DeleteConvoModalProps = {
  onClose: () => void;
};

export const DeleteConvoModal: React.FC<DeleteConvoModalProps> = ({
  onClose,
}) => {
  const convo = Route.useLoaderData();
  const { client } = useConvo();
  const inboxId = useInboxId();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    log.trace("deleteConvoData", { convoId: convo.id });
    setDeleting(true);
    try {
      if (client?.installationId) {
        await unregisterConvo(client.installationId).catch((err: unknown) => {
          log.warn("push unregister failed", err);
        });
      }
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
      onClose={onClose}
      title="Delete conversation"
      withCloseButton={false}>
      <Stack gap="md">
        <Text size="sm">
          This action is permanent and cannot be undone. All conversation data
          on this machine will be lost and the XMTP identity for this
          conversation will be destroyed.
        </Text>
        <Stack gap="xxs">
          <Button
            variant="filled"
            color="red"
            size="lg"
            radius="lg"
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
