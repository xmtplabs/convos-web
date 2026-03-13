import { Button, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

type UnlockConvoModalProps = {
  onClose: () => void;
};

export const UnlockConvoModal: React.FC<UnlockConvoModalProps> = ({
  onClose,
}) => {
  const { convo, unlock } = useConvo();
  const [loading, setLoading] = useState(false);

  log.trace("render", { convoId: convo.id, loading });

  const handleLock = async () => {
    log.info("unlock action started", { convoId: convo.id });
    setLoading(true);
    try {
      await unlock();
      log.info("unlock action succeeded", { convoId: convo.id });
      onClose();
    } catch (err) {
      log.error("unlock action failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={() => {
        log.info("unlock modal closed", { convoId: convo.id });
        onClose();
      }}
      size="sm"
      title="Locked">
      <Stack gap="md">
        <Text size="lg" fw="bold">
          Unlock to enable invites
        </Text>
        <Text size="sm">Allow new members to join.</Text>
        <Stack gap="xxs">
          <Button
            variant="filled"
            size="lg"
            radius="lg"
            onClick={() => {
              void handleLock();
            }}
            loading={loading}>
            Unlock
          </Button>
          <ModalCloseButton disabled={loading}>Cancel</ModalCloseButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
