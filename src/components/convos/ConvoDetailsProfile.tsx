import { Avatar, Stack, Text } from "@mantine/core";
import { ImageIcon } from "lucide-react";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";
import { GROUP_IMAGE_INBOX_ID } from "@/utils/avatars";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-details-profile");

export const ConvoDetailsProfile: React.FC = () => {
  const { convo } = useConvo();
  const groupImage = useAvatar(convo.id, GROUP_IMAGE_INBOX_ID);
  log.trace("render");

  return (
    <Stack align="center" gap="xs">
      <Avatar radius="100%" size="140" src={groupImage}>
        {groupImage === null && <ImageIcon size={64} />}
      </Avatar>
      <Text size="xxl" fw={600} ta="center" truncate maw="100%">
        {convo.name}
      </Text>
      {convo.description && (
        <Text size="sm" c="dimmed" ta="center" truncate maw="100%">
          {convo.description}
        </Text>
      )}
    </Stack>
  );
};
