import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { LoadingMessage } from "@/components/shared/LoadingMessage";
import { useXmtp } from "@/hooks/useXmtp";
import { createLogger } from "@/utils/log";

const log = createLogger("new-convo");

const NewConvo = () => {
  log.trace("render");
  const { createConvo } = useXmtp();
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    log.info("creating");
    void createConvo().then((convo) => {
      log.info("created, navigating", { convoId: convo.id });
      void navigate({
        to: "/convo/$convoId",
        params: { convoId: convo.id },
      });
    });
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, []);

  return <LoadingMessage message="Creating new convo..." />;
};

export const Route = createFileRoute("/_app/new")({
  component: NewConvo,
  ssr: false,
});
