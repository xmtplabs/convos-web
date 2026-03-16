import { Button, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ConvoHeader } from "@/components/convos/ConvoHeader";
import { useConvo } from "@/hooks/useConvo";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { deleteConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("convo");

export const ConvoError: React.FC = () => {
  const { convo, retry } = useConvo();
  const navigate = useNavigate();

  const handleDelete = () => {
    log.info("deleting failed convo", { convoId: convo.id });
    void deleteConvo(convo.id).then(() => {
      void navigate({ to: "/" });
    });
  };

  return (
    <ConvoLayout header={<ConvoHeader />} footer={null}>
      <CenteredLayout>
        <Stack gap="md" align="center">
          <Text size="sm" c="dimmed">
            Failed to set up this conversation.
          </Text>
          <Button variant="filled" onClick={retry}>
            Retry
          </Button>
          <Button variant="subtle" color="red" onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
      </CenteredLayout>
    </ConvoLayout>
  );
};
