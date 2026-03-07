import {
  ActionIcon,
  Box,
  Button,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useNav } from "@/contexts/NavContext";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("welcome");

export const Welcome = () => {
  log.trace("render");
  const { openNav } = useNav();

  return (
    <CenteredLayout>
      <ActionIcon
        variant="transparent"
        onClick={openNav}
        hiddenFrom="sm"
        pos="absolute"
        top="md"
        left="md">
        <MenuIcon size={24} />
      </ActionIcon>
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
