import {
  Alert,
  Button,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import {
  parseInviteSlug,
  sendJoinRequest,
  type ParsedInvite,
} from "@/utils/invite";

const AcceptInvite = () => {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string>();

  const parsed = useMemo((): ParsedInvite | null => {
    try {
      const result = parseInviteSlug(slug);
      return result;
    } catch {
      return null;
    }
  }, [slug]);

  const handleJoin = useCallback(() => {
    if (!parsed) {
      return;
    }
    setStatus("sending");
    setError(undefined);
    sendJoinRequest(parsed)
      .then((convo) => {
        void navigate({
          to: "/convo/$convoId",
          params: { convoId: convo.id },
        });
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : "Failed to send join request",
        );
        setStatus("error");
      });
  }, [parsed, navigate]);

  if (!parsed) {
    return (
      <CenteredLayout>
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <Title order={3}>Invalid Invite</Title>
            <Text c="dimmed">This invite link is invalid or has expired.</Text>
          </Stack>
        </Paper>
      </CenteredLayout>
    );
  }

  const { payload } = parsed;

  return (
    <CenteredLayout>
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <Title order={3}>{payload.name ?? "Conversation"}</Title>
          {payload.description && <Text c="dimmed">{payload.description}</Text>}
          <Text size="sm" c="dimmed" ta="center">
            You&apos;ve been invited to join this conversation. Tap Join to send
            a request — the creator will be notified and can add you.
          </Text>

          {status === "idle" && (
            <Button onClick={handleJoin} fullWidth>
              Join
            </Button>
          )}

          {status === "sending" && (
            <Stack align="center" gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Sending join request...
              </Text>
            </Stack>
          )}

          {status === "error" && (
            <Stack align="center" gap="xs">
              <Alert color="red" w="100%">
                {error}
              </Alert>
              <Button onClick={handleJoin} variant="light" fullWidth>
                Retry
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </CenteredLayout>
  );
};

export const Route = createFileRoute("/_app/i/$slug")({
  component: AcceptInvite,
  ssr: false,
});
