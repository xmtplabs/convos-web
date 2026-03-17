import { Stack, Text } from "@mantine/core";
import { TicketXIcon } from "lucide-react";
import { createLogger } from "@/utils/log";

const log = createLogger("invite-invalid");

export const InvalidInvite: React.FC = () => {
  log.trace("render");
  return (
    <Stack align="center" gap="md">
      <TicketXIcon size={48} />
      <Text ta="center" size="xl" fw="bold">
        Invalid invite
      </Text>
      <Text ta="center">This invite link is invalid or has expired.</Text>
    </Stack>
  );
};
