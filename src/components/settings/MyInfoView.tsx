import { Stack, Text } from "@mantine/core";
import { Quickname } from "@/components/app/Quickname";

export const MyInfoView: React.FC<{
  onDirtyChange: (dirty: boolean) => void;
}> = ({ onDirtyChange }) => (
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
