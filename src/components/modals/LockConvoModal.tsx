import { Button, Stack, Text } from "@mantine/core";
import {
  PermissionPolicy,
  PermissionUpdateType,
  Group as XmtpGroup,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

type LockConvoModalProps = {
  onClose: () => void;
};

export const LockConvoModal: React.FC<LockConvoModalProps> = ({ onClose }) => {
  const { convo, conversation } = useConvo();
  const [loading, setLoading] = useState(false);

  log.trace("render", { convoId: convo.id, loading });

  const handleLock = async () => {
    log.info("lock action started", { convoId: convo.id });
    setLoading(true);
    try {
      if (conversation instanceof XmtpGroup) {
        await conversation.updatePermission(
          PermissionUpdateType.AddMember,
          PermissionPolicy.Deny,
        );
        await updateConvo(convo.id, { locked: true });
        log.info("lock action succeeded", { convoId: convo.id });
        onClose();
      } else {
        log.debug("lock skipped, not a group", { convoId: convo.id });
      }
    } catch (err) {
      log.error("lock action failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={() => {
        log.info("lock modal closed", { convoId: convo.id });
        onClose();
      }}
      size="sm"
      title="Lock?">
      <Stack gap="md">
        <Text size="md" fw="bold">
          Nobody new can join.
        </Text>
        <Text size="sm">
          New convo codes can’t be created, and any outstanding codes will no
          longer work.
        </Text>
        <Stack gap="xxs">
          <Button
            variant="filled"
            size="md"
            radius="lg"
            onClick={() => {
              void handleLock();
            }}
            loading={loading}>
            Lock
          </Button>
          <ModalCloseButton disabled={loading}>Cancel</ModalCloseButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
