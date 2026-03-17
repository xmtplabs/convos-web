import { Button, Code, Group, Paper, Stack, Text } from "@mantine/core";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";
import { LinkButton } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app-error");

export const AppError = ({ error, reset }: ErrorComponentProps) => {
  log.error("render", error);

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

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
          <AlertTriangleIcon size={40} color="var(--mantine-color-red-6)" />
          <Text fw={600} size="lg">
            Something went wrong
          </Text>
          <Code block style={{ maxWidth: "100%", wordBreak: "break-word" }}>
            {message}
          </Code>
          <Group gap="sm">
            <Button
              variant="filled"
              radius="xl"
              onClick={() => {
                log.info("retry clicked");
                reset();
              }}>
              Try again
            </Button>
            <LinkButton variant="light" radius="xl" to="/">
              Go home
            </LinkButton>
          </Group>
        </Stack>
      </Paper>
    </CenteredLayout>
  );
};
