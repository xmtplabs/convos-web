import { Avatar, Box, Stack, Text } from "@mantine/core";
import { ImageIcon } from "lucide-react";
import type { Convo } from "@/db";
import { useAvatar } from "@/hooks/useAvatar";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-card");

type ConvoCardProps = React.PropsWithChildren<{
  convo: Convo;
}>;

export const ConvoCard: React.FC<ConvoCardProps> = ({ convo, children }) => {
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);
  log.trace("render");

  return (
    <Box bg="gray.1" bdrs="lg" p="lg">
      <Stack gap="xs" align="center">
        <Avatar radius="100%" size="140" flex="0 0 auto" src={groupImage}>
          {groupImage === null && <ImageIcon size={64} />}
        </Avatar>
        <Text size="xxl" fw={500} truncate maw="100%">
          {convo.name}
        </Text>
        {convo.description && (
          <Text size="sm" c="dimmed" truncate maw="100%">
            {convo.description}
          </Text>
        )}
        {children}
      </Stack>
    </Box>
  );
};
