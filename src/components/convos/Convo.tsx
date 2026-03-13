import { Outlet, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";
import { ConvoContent } from "@/components/convos/ConvoContent";
import { ConvoPending } from "@/components/convos/ConvoPending";
import { ConvoProvider } from "@/contexts/ConvoContext";
import { db } from "@/db";
import { useXmtp } from "@/hooks/useXmtp";
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
  const { conversation, setConvo } = useXmtp();
  const navigate = useNavigate();
  const hasLoaded = useRef(false);

  if (liveConvo) {
    hasLoaded.current = true;
  }

  useEffect(() => {
    if (hasLoaded.current && !liveConvo) {
      log.info("convo deleted, navigating home");
      void navigate({ to: "/" });
    }
  }, [liveConvo, navigate]);

  // set convo when it changes — no cleanup here so switching convos
  // goes directly from old → new without an intermediate null that
  // would close the client and race with OPFS
  useEffect(() => {
    log.trace("setConvo", { convoId: loaderConvo.id });
    setConvo(loaderConvo);
  }, [loaderConvo.id, setConvo, loaderConvo]);

  // disconnect only on true unmount (navigating away from convo routes)
  useEffect(() => {
    return () => {
      log.trace("unmounting, disconnecting");
      setConvo(null);
    };
  }, [setConvo]);

  if (convo.status === "pending") {
    return (
      <>
        <ConvoPending />
        <Outlet />
      </>
    );
  }

  return (
    <ConvoProvider key={convo.id} convo={convo} conversation={conversation}>
      <ConvoContent />
      <Outlet />
    </ConvoProvider>
  );
};
