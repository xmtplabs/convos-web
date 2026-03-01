import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Logo } from "@/components/shared/Logo";
import { useAppLockContext } from "@/contexts/AppLockContext";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

export const AppLockScreen = () => {
  const { acquireLock } = useAppLockContext();

  log.trace("render");

  return (
    <CenteredLayout fullScreen>
      <Paper p="xl" radius="md" bg="gray.1">
        <Stack align="center" gap="md">
          <Group gap="xxxs" align="center" wrap="nowrap">
            <Logo size={36} />
            <Text fw="bold" size="xl">
              Convos
            </Text>
          </Group>
          <Text>
            This app is active in another browser tab or window. Close or
            disconnect that session, or use this instance instead.
          </Text>
          <Button
            variant="filled"
            radius="xl"
            onClick={() => {
              log.info("force acquire lock clicked");
              acquireLock(true);
            }}>
            Disconnect other session
          </Button>
        </Stack>
      </Paper>
    </CenteredLayout>
  );
};
