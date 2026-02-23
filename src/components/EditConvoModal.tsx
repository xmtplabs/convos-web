import {
  Button,
  Group,
  Modal,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useState } from "react";
import { LinkButton } from "@/components/Button";
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
      void updateConvo({
        ...convo,
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
      radius="lg"
      opened={opened}
      closeOnEscape={false}
      closeOnClickOutside={false}
      onClose={onClose}
      title="Edit convo"
      styles={{
        title: { fontSize: "var(--mantine-h3-font-size)", fontWeight: 700 },
      }}
      withCloseButton={false}
      centered>
      <Stack gap="md">
        <TextInput
          variant="filled"
          label="Name"
          disabled={!canEditName}
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
        />
        <Textarea
          variant="filled"
          label="Description"
          disabled={!canEditDescription}
          value={description}
          onChange={(e) => {
            setDescription(e.currentTarget.value);
          }}
          autosize
          minRows={2}
        />
        <Group justify="space-between" gap="xxs">
          <LinkButton
            to="/convo/$convoId/delete"
            params={{ convoId: convo.id }}
            variant="light"
            color="red"
            radius="xl">
            Delete convo
          </LinkButton>
          <Group gap="xxs">
            <Button
              variant="default"
              radius="xl"
              onClick={onClose}
              disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="filled"
              radius="xl"
              onClick={() => {
                void handleSave();
              }}
              loading={saving}>
              Save
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
