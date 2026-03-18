import { Box, Group, Stack, Text } from "@mantine/core";
import { InfoIcon } from "lucide-react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import { UnstyledLink } from "@/components/shared/UnstyledLink";
import type { ResolvedConvo } from "@/contexts/ConvoContext";

type ConvoSummaryProps = {
  convo: ResolvedConvo;
};

export const ConvoSummary: React.FC<ConvoSummaryProps> = ({ convo }) => (
  <Box px="lg" pt="lg">
    <ConvoCard convo={convo} />
    <Stack gap="xxxs" align="center" p="md">
      <UnstyledLink
        to="."
        search={(prev) => ({ ...prev, modal: "convo-info" })}>
        <Group gap="xxxs" align="center">
          <Text size="xs">New convo, new everything</Text>
          <InfoIcon size={16} />
        </Group>
      </UnstyledLink>
      <Text size="xs" c="dimmed">
        For privacy, new members can&apos;t see earlier messages.
      </Text>
    </Stack>
  </Box>
);
