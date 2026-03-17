import { ActionIcon, Group, Paper, Stack, Text } from "@mantine/core";
import { ReplyIcon, XIcon } from "lucide-react";
import { createLogger } from "@/utils/log";

const log = createLogger("reply-preview");

export type ReplyPreviewProps = {
  replyTo: string;
  replyMessage: string;
  onCancel: () => void;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyTo,
  replyMessage,
  onCancel,
}) => {
  log.trace("render");
  return (
    <Paper p="xs" radius="md" withBorder>
      <Group gap="xs" align="flex-start" wrap="nowrap" justify="space-between">
        <Stack gap="0">
          <Group gap={6} align="center" w="100%" miw={0}>
            <ReplyIcon size={16} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {replyTo}
            </Text>
          </Group>
          <Text size="sm" c="dimmed">
            {replyMessage}
          </Text>
        </Stack>
        <ActionIcon
          aria-label="Cancel reply"
          variant="light"
          radius="xl"
          onClick={onCancel}>
          <XIcon size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
};
