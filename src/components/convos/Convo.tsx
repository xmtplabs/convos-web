import { Outlet, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useContext, useEffect, useRef } from "react";
import { ConvoContent } from "@/components/convos/ConvoContent";
import { ConvoPending } from "@/components/convos/ConvoPending";
import { MessagesSkeleton } from "@/components/shared/MessagesSkeleton";
import { ConvoProvider } from "@/contexts/ConvoContext";
import { XmtpContext } from "@/contexts/XmtpContext";
import { db } from "@/db";
import { Route } from "@/routes/_app/convo/$convoId";
import { createLogger } from "@/utils/log";

const log = createLogger("convo");

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

  if (convo.status === "pending") {
    return (
      <>
        <ConvoPending />
        <Outlet />
      </>
    );
  }

  if (!ctx) {
    return <MessagesSkeleton />;
  }

  // keep showing the convo even if status briefly changes
  const conversation = ctx.conversation ?? conversationRef.current;
  if (conversation) {
    return (
      <ConvoProvider key={convo.id} convo={convo} conversation={conversation}>
        <ConvoContent />
        <Outlet />
      </ConvoProvider>
    );
  }

  return <MessagesSkeleton />;
};
