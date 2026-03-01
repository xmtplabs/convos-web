import { Button, Loader, Paper, Stack, Text } from "@mantine/core";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { SendIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ConvoHeader } from "@/components/convos/ConvoHeader";
import { Composer } from "@/components/messages/Composer";
import { MessageList } from "@/components/messages/MessageList";
import { LoadingMessage } from "@/components/shared/LoadingMessage";
import { Modal } from "@/components/shared/Modal";
import { ConvoContext, ConvoProvider } from "@/contexts/ConvoContext";
import { XmtpContext } from "@/contexts/XmtpContext";
import { db } from "@/db";
import { useMessages } from "@/hooks/useMessages";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { Route } from "@/routes/_app/convo/$convoId";
import { resendJoinRequest } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("convo");

const ConvoContent = () => {
  const { messages, messagesLoading } = useMessages();
  const ctx = useContext(ConvoContext);

  return (
    <>
      <ConvoLayout
        header={<ConvoHeader />}
        footer={<Composer />}
        loading={ctx?.exploding}
        withScrollArea={false}>
        {messagesLoading ? (
          <LoadingMessage message="Connecting..." />
        ) : (
          <MessageList messages={messages} />
        )}
      </ConvoLayout>
      <Modal
        opened={ctx?.pendingExplode != null}
        onClose={() => ctx?.cancelExplode()}
        title={
          ctx?.pendingExplode?.immediate ? "Explode now?" : "Light the fuse?"
        }>
        <Stack gap="md">
          <Text size="sm">
            {ctx?.pendingExplode?.immediate
              ? "This convo will be destroyed immediately for everyone."
              : "The countdown can\u2019t be changed or cancelled once it starts."}
          </Text>
          <Stack gap="xxs">
            <Button
              variant="filled"
              color="red"
              size="md"
              radius="lg"
              onClick={() => ctx?.confirmExplode()}>
              {ctx?.pendingExplode?.immediate ? "Explode" : "Start"}
            </Button>
            <Button
              variant="default"
              size="md"
              radius="lg"
              onClick={() => ctx?.cancelExplode()}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Modal>
      <Modal
        opened={ctx?.explodeError != null}
        onClose={() => ctx?.clearExplodeError()}
        title="Explode Failed">
        <Stack gap="md">
          <Text size="sm">{ctx?.explodeError}</Text>
          <Button
            variant="default"
            size="md"
            radius="lg"
            onClick={() => ctx?.clearExplodeError()}>
            OK
          </Button>
        </Stack>
      </Modal>
    </>
  );
};

const PendingConvo: React.FC<{ isChecking: boolean }> = ({ isChecking }) => {
  const convo = Route.useLoaderData();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = useCallback(() => {
    setResending(true);
    setResent(false);
    resendJoinRequest(convo)
      .then(() => {
        setResent(true);
      })
      .catch((err: unknown) => {
        log.error("resend join request failed", err);
      })
      .finally(() => {
        setResending(false);
      });
  }, [convo]);

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
  const ctx = useContext(XmtpContext);
  const navigate = useNavigate();
  const hasLoaded = useRef(false);
  const conversationRef = useRef(ctx?.conversation ?? null);

  if (ctx?.conversation) {
    conversationRef.current = ctx.conversation;
  }
  if (liveConvo) {
    hasLoaded.current = true;
  }

  useEffect(() => {
    if (hasLoaded.current && !liveConvo) {
      log.info("convo deleted, navigating home");
      void navigate({ to: "/" });
    }
  }, [liveConvo, navigate]);

  useEffect(() => {
    log.trace("mounting", { convoId: loaderConvo.id });
    ctx?.setConvo(loaderConvo);
    return () => {
      log.trace("unmounting", { convoId: loaderConvo.id });
      ctx?.setConvo(null);
    };
  }, [loaderConvo.id, ctx?.setConvo]);

  if (!ctx) {
    return <LoadingMessage message="Connecting..." />;
  }

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
        <PendingConvo isChecking={ctx.status === "loading"} />
        <Outlet />
      </>
    );
  }

  return <LoadingMessage message="Connecting..." />;
};
