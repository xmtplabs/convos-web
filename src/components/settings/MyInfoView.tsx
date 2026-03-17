import { Stack, Text } from "@mantine/core";
import { Quickname } from "@/components/app/Quickname";
import { createLogger } from "@/utils/log";

const log = createLogger("settings-my-info");

export const MyInfoView: React.FC<{
  onDirtyChange: (dirty: boolean) => void;
}> = ({ onDirtyChange }) => {
  log.trace("render");
  return (
    <Stack gap="md">
      <Stack gap="xxxs">
        <Text size="sm">Private unless you choose to share it</Text>
        <Text size="xs" c="dimmed">
          Your info is stored on your device only
        </Text>
      </Stack>
      <Quickname onDirtyChange={onDirtyChange} />
    </Stack>
  );
};
