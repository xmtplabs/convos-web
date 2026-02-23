import { Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const NotFound = () => {
  return (
    <CenteredLayout>
      <Stack>
        <Title order={1}>404 - Page Not Found</Title>
        <Text>The page you're looking for doesn't exist.</Text>
        <Link to="/">Go Home</Link>
      </Stack>
    </CenteredLayout>
  );
};
