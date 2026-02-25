import { Button, Stack, Text } from "@mantine/core";
import {
  PermissionPolicy,
  PermissionUpdateType,
  Group as XmtpGroup,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";

type LockConvoModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const LockConvoModal: React.FC<LockConvoModalProps> = ({
  opened,
  onClose,
}) => {
  const { convo, conversation } = useConvo();
  const [loading, setLoading] = useState(false);

  const handleLock = async () => {
    setLoading(true);
    try {
      if (conversation instanceof XmtpGroup) {
        await conversation.updatePermission(
          PermissionUpdateType.AddMember,
          PermissionPolicy.Deny,
        );
        await updateConvo(convo.id, { locked: true });
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} size="sm" title="Lock?">
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
          <Button
            variant="default"
            size="md"
            radius="lg"
            onClick={onClose}
            disabled={loading}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
