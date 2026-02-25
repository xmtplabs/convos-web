import { Button, Loader, Paper, Stack, Text } from "@mantine/core";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { SendIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConvoHeader } from "@/components/convos/ConvoHeader";
import { Composer } from "@/components/messages/Composer";
import { MessageList } from "@/components/messages/MessageList";
import { LoadingMessage } from "@/components/shared/LoadingMessage";
import { ConvoProvider } from "@/contexts/ConvoContext";
import { db } from "@/db";
import { useClient } from "@/hooks/useClient";
import { useMessages } from "@/hooks/useMessages";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { Route } from "@/routes/_app/convo/$convoId";
import { resendJoinRequest } from "@/utils/invite";

const ConvoContent = () => {
  const { messages, messagesLoading } = useMessages();

  return (
    <ConvoLayout
      header={<ConvoHeader />}
      footer={<Composer />}
      withScrollArea={false}>
      {messagesLoading ? (
        <LoadingMessage message="Connecting..." />
      ) : (
        <MessageList messages={messages} />
      )}
    </ConvoLayout>
  );
};

const PendingConvo = () => {
  const convo = Route.useLoaderData();
  const ctx = useClient();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = useCallback(() => {
    setResending(true);
    setResent(false);
    resendJoinRequest(convo)
      .then(() => {
        setResent(true);
      })
      .catch(() => {})
      .finally(() => {
        setResending(false);
      });
  }, [convo]);

  const isChecking = ctx.status === "loading";

  return (
    <ConvoLayout
      header={
        <Text fw={500} size="md" truncate>
          {convo.name ?? "New Convo"}
        </Text>
      }
      footer={null}
      withScrollArea={false}>
      <Stack align="center" justify="center" flex={1} px="md">
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            {isChecking ? (
              <>
                <Loader size={24} />
                <Text size="sm" c="dimmed" ta="center">
                  Checking invite status...
                </Text>
              </>
            ) : (
              <>
                <Text size="sm" c="dimmed" ta="center">
                  Join request sent. Waiting for the creator to add you.
                </Text>
                <Button
                  variant="light"
                  leftSection={
                    resending ? <Loader size={16} /> : <SendIcon size={16} />
                  }
                  disabled={resending}
                  onClick={handleResend}>
                  {resent ? "Re-request sent" : "Re-request to join"}
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </ConvoLayout>
  );
};

export const Convo = () => {
  const loaderConvo = Route.useLoaderData();
  const liveConvo = useLiveQuery(
    () => db.convos.get(loaderConvo.id),
    [loaderConvo.id],
  );
  const convo = liveConvo ?? loaderConvo;
  const ctx = useClient();
  const navigate = useNavigate();
  const hasLoaded = useRef(false);
  const conversationRef = useRef(ctx.conversation);

  if (ctx.conversation) {
    conversationRef.current = ctx.conversation;
  }
  if (liveConvo) {
    hasLoaded.current = true;
  }

  useEffect(() => {
    if (hasLoaded.current && !liveConvo) {
      void navigate({ to: "/" });
    }
  }, [liveConvo, navigate]);

  useEffect(() => {
    ctx.setConvo(loaderConvo);
    return () => {
      ctx.setConvo(null);
    };
  }, [loaderConvo.id, ctx.setConvo]);

  // keep showing the convo even if status briefly changes
  const conversation = ctx.conversation ?? conversationRef.current;
  if (conversation) {
    return (
      <ConvoProvider convo={convo} conversation={conversation}>
        <ConvoContent />
        <Outlet />
      </ConvoProvider>
    );
  }

  if (loaderConvo.status === "pending") {
    return (
      <>
        <PendingConvo />
        <Outlet />
      </>
    );
  }

  return <LoadingMessage message="Connecting..." />;
};
