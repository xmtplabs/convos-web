import { Button, Stack, TextInput } from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useState } from "react";
import { useConvo } from "@/hooks/useConvo";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("edit-convo");

type EditConvoPanelProps = {
  onDone: () => void;
};

export const EditConvoPanel: React.FC<EditConvoPanelProps> = ({ onDone }) => {
  const { convo, conversation, permissions } = useConvo();
  const canEditName = permissions?.canEditName ?? false;
  const canEditDescription = permissions?.canEditDescription ?? false;
  const [name, setName] = useState(convo.name ?? "");
  const [description, setDescription] = useState(convo.description ?? "");
  const [saving, setSaving] = useState(false);

  log.trace("render", { convoId: convo.id, saving });

  const handleSave = async () => {
    if (!(conversation instanceof XmtpGroup)) {
      log.debug("save skipped, not a group", { convoId: convo.id });
      return;
    }
    log.info("save started", {
      convoId: convo.id,
      canEditName,
      canEditDescription,
    });
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
      log.info("save succeeded", { convoId: convo.id });
      onDone();
    } catch (err) {
      log.error("save failed", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Name"
        size="md"
        disabled={!canEditName}
        value={name}
        onChange={(e) => {
          setName(e.currentTarget.value);
        }}
      />
      <TextInput
        label="Description"
        description="Descriptions are optional"
        size="md"
        disabled={!canEditDescription}
        value={description}
        onChange={(e) => {
          setDescription(e.currentTarget.value);
        }}
      />
      <Button
        variant="filled"
        size="lg"
        radius="lg"
        onClick={() => {
          void handleSave();
        }}
        loading={saving}>
        Save
      </Button>
    </Stack>
  );
};
