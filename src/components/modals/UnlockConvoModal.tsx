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

type UnlockConvoModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const UnlockConvoModal: React.FC<UnlockConvoModalProps> = ({
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
          PermissionPolicy.Allow,
        );
        await updateConvo(convo.id, { locked: false });
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} size="sm" title="Locked">
      <Stack gap="md">
        <Text size="lg" fw="bold">
          Unlock to enable invites
        </Text>
        <Text size="sm">Allow new members to join.</Text>
        <Stack gap="xxs">
          <Button
            variant="filled"
            size="md"
            radius="lg"
            onClick={() => {
              void handleLock();
            }}
            loading={loading}>
            Unlock
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
