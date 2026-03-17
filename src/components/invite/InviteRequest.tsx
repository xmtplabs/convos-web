import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import { HourglassIcon } from "lucide-react";
import { createLogger } from "@/utils/log";

const log = createLogger("invite-request");

export type InviteRequestProps = {
  error?: string;
};

export const InviteRequest: React.FC<InviteRequestProps> = ({ error }) => {
  log.trace("render");
  return (
    <Stack align="center" gap="md">
      <HourglassIcon size={48} />
      <Text ta="center" size="xl" fw="bold">
        You were invited to a private chat
      </Text>
      <Text ta="center">
        Convos lets people chat instantly without creating an account.
      </Text>
      <Text ta="center">
        Someone in the conversation will approve you before you can join.
      </Text>
      {error ? (
        <Alert color="red" w="100%">
          {error}
        </Alert>
      ) : (
        <Group gap="xxs">
          <Loader size="sm" />
          <Text fw="bold">Requesting access...</Text>
        </Group>
      )}
    </Stack>
  );
};
