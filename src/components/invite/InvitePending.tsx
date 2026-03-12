import { Stack, Text } from "@mantine/core";
import { Logo } from "@/components/shared/Logo";

export const InvitePending: React.FC = () => {
  return (
    <Stack align="center" gap="md">
      <Logo size={48} />
      <Text ta="center" size="xl" fw="bold">
        Request sent
      </Text>
      <Text ta="center">
        Waiting for someone in the chat to approve your request.
      </Text>
      <Text ta="center">
        Keep this window open, you'll join automatically when approved.
      </Text>
    </Stack>
  );
};
