import { Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("not-found");

export const NotFound = () => {
  log.trace("render");

  return (
    <CenteredLayout>
      <Stack>
        <Title order={1}>404 - Page Not Found</Title>
        <Text>The page you&apos;re looking for doesn&apos;t exist.</Text>
        <Link to="/">Go Home</Link>
      </Stack>
    </CenteredLayout>
  );
};
