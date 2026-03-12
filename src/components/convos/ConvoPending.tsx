import { Paper, Text } from "@mantine/core";
import { InvitePending } from "@/components/invite/InvitePending";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { Route } from "@/routes/_app/convo/$convoId";

export const ConvoPending: React.FC = () => {
  const convo = Route.useLoaderData();

  return (
    <ConvoLayout
      header={
        <Text fw={500} size="md" truncate>
          {convo.name ?? "New Convo"}
        </Text>
      }
      footer={null}
      withScrollArea={false}>
      <CenteredLayout>
        <Paper p="xl" radius="md" bg="gray.1">
          <InvitePending />
        </Paper>
      </CenteredLayout>
    </ConvoLayout>
  );
};
