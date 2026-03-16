import { Outlet, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";
import { ConvoContent } from "@/components/convos/ConvoContent";
import { ConvoError } from "@/components/convos/ConvoError";
import { ConvoPending } from "@/components/convos/ConvoPending";
import { ConvoProvider } from "@/contexts/ConvoContext";
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
  const status = convo.status;
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

  return (
    <ConvoProvider key={convo.id} convo={convo}>
      {status === "pending" && <ConvoPending />}
      {status === "error" && <ConvoError />}
      {(status === "creating" || status === "ready") && (
        <>
          <ConvoContent />
          <Outlet />
        </>
      )}
    </ConvoProvider>
  );
};
