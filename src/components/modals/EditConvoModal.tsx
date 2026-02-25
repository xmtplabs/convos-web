import { Button, Stack, Textarea, TextInput } from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";

type EditConvoModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const EditConvoModal: React.FC<EditConvoModalProps> = ({
  opened,
  onClose,
}) => {
  const { convo, conversation, permissions } = useConvo();
  const canEditName = permissions?.canEditName ?? false;
  const canEditDescription = permissions?.canEditDescription ?? false;
  const [name, setName] = useState(convo.name ?? "");
  const [description, setDescription] = useState(convo.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!(conversation instanceof XmtpGroup)) return;
    setSaving(true);
    try {
      if (canEditName && name !== (convo.name ?? "")) {
        await conversation.updateName(name);
      }
      if (canEditDescription && description !== (convo.description ?? "")) {
        await conversation.updateDescription(description);
      }
      void updateConvo(convo.id, {
        name: name || undefined,
        description: description || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      closeOnEscape={false}
      closeOnClickOutside={false}
      onClose={onClose}
      title="Edit convo">
      <Stack gap="md">
        <TextInput
          label="Name"
          disabled={!canEditName}
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
        />
        <Textarea
          label="Description"
          disabled={!canEditDescription}
          value={description}
          onChange={(e) => {
            setDescription(e.currentTarget.value);
          }}
          autosize
          minRows={2}
        />
        <Stack gap="xxs">
          <Button
            variant="filled"
            size="md"
            radius="lg"
            onClick={() => {
              void handleSave();
            }}
            loading={saving}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
