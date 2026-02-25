import { Button, Group, Stack, Text } from "@mantine/core";
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
    <Modal opened={opened} onClose={onClose} title="Locked">
      <Stack gap="md">
        <Text size="lg" fw="bold">
          Unlock to enable invites
        </Text>
        <Text size="sm">Allow new members to join.</Text>
        <Group justify="flex-end" gap="xxs">
          <Button
            variant="default"
            radius="xl"
            onClick={onClose}
            disabled={loading}>
            Keep locked
          </Button>
          <Button
            variant="filled"
            radius="xl"
            onClick={() => {
              void handleLock();
            }}
            loading={loading}>
            Unlock
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
