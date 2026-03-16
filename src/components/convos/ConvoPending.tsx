import { Avatar, Group, Paper, Stack, Text } from "@mantine/core";
import { ImageIcon } from "lucide-react";
import { InvitePending } from "@/components/invite/InvitePending";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { Route } from "@/routes/_app/convo/$convoId";

export const ConvoPending: React.FC = () => {
  const convo = Route.useLoaderData();

  return (
    <ConvoLayout
      header={
        <Group gap="sm" wrap="nowrap" style={{ overflow: "hidden" }}>
          <Avatar radius="xl" size="48" src={convo.imageUrl}>
            {!convo.imageUrl && <ImageIcon size={24} />}
          </Avatar>
          <Stack gap="0" style={{ overflow: "hidden" }}>
            <Text fw={500} size="md" truncate>
              {convo.name}
            </Text>
            {convo.description && (
              <Text size="xs" c="dimmed" truncate>
                {convo.description}
              </Text>
            )}
          </Stack>
        </Group>
      }
      footer={null}>
      <CenteredLayout>
        <Paper p="xl" radius="md" bg="gray.1">
          <InvitePending />
        </Paper>
      </CenteredLayout>
    </ConvoLayout>
  );
};
