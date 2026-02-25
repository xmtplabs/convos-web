import { Box, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const Welcome = () => {
  return (
    <CenteredLayout>
      <Paper p="xl" bg="gray.1" radius="md">
        <Stack gap="md">
          <Title order={1}>Pop-up private convos</Title>
          <Stack gap={0}>
            <Text c="dimmed">Chat instantly with anybody.</Text>
            <Text c="dimmed">No account. New you every time.</Text>
          </Stack>
          <Box>
            <Button component={Link} to="/new" size="md" radius="xl">
              Start a convo
            </Button>
          </Box>
        </Stack>
      </Paper>
    </CenteredLayout>
  );
};
