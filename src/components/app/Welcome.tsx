import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { MenuIcon, SettingsIcon } from "lucide-react";
import { LinkActionIcon } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { useNav } from "@/contexts/NavContext";
import { useConvos } from "@/hooks/useConvos";
import { useIsMobile } from "@/hooks/useMobile";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("welcome");

export const Welcome = () => {
  log.trace("render");
  const { openNav } = useNav();
  const convos = useConvos();
  const isMobile = useIsMobile();
  const hasConvos = convos.length > 0;
  const showHeader = !hasConvos || isMobile;

  return (
    <Stack gap={0} h="100%">
      {showHeader && (
        <Group
          gap="xs"
          px="md"
          align="center"
          justify="space-between"
          h="var(--convos-header-height)"
          style={{ flexShrink: 0 }}>
          <Group gap="xxxs" align="center" wrap="nowrap">
            {hasConvos && (
              <ActionIcon variant="transparent" onClick={openNav}>
                <MenuIcon size={24} />
              </ActionIcon>
            )}
            <Logo size={36} />
            <Text fw="bold" size="xl">
              Convos
            </Text>
          </Group>
          <LinkActionIcon
            variant="transparent"
            radius="xl"
            size="lg"
            to="."
            search={{ modal: "about" }}>
            <SettingsIcon size={24} />
          </LinkActionIcon>
        </Group>
      )}
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
    </Stack>
  );
};
