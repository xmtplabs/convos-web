import { ActionIcon, Box, Group, Paper, Text } from "@mantine/core";
import { XIcon } from "lucide-react";
import { useMemo } from "react";
import { formatFileSize } from "@/utils/attachment";
import { createLogger } from "@/utils/log";

const log = createLogger("messaging");

export type AttachmentPreviewProps = {
  file: File;
  onCancel: () => void;
  disabled?: boolean;
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  file,
  onCancel,
  disabled,
}) => {
  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const fileType = file.type.split("/")[0];
  const fileSize = formatFileSize(file.size);

  log.trace("render", {
    name: file.name,
    size: file.size,
    fileType,
  });

  return (
    <Paper p="xs" radius="md" withBorder>
      <Group gap="xs" align="flex-start" wrap="nowrap" justify="space-between">
        <Box style={{ flex: 1, minWidth: 0 }}>
          {fileType === "image" && (
            <img
              src={fileUrl}
              alt={file.name}
              style={{
                width: "100%",
                maxHeight: "300px",
                borderRadius: "var(--mantine-radius-sm)",
                objectFit: "contain",
              }}
            />
          )}
          <Group gap="xxs" mt="xs" align="center">
            <Text size="sm" fw={500} truncate>
              {file.name}
            </Text>
            <Text size="sm" c="dimmed">
              {fileSize}
            </Text>
          </Group>
        </Box>
        <ActionIcon
          aria-label="Cancel attachment"
          variant="light"
          radius="xl"
          onClick={() => {
            log.info("cancel", { name: file.name });
            onCancel();
          }}
          disabled={disabled}>
          <XIcon size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
};
