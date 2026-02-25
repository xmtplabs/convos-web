import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { LoadingMessage } from "@/components/shared/LoadingMessage";
import { useClient } from "@/hooks/useClient";

const NewConvo = () => {
  const { createConvo } = useClient();
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void createConvo().then((convo) => {
      void navigate({
        to: "/convo/$convoId",
        params: { convoId: convo.id },
      });
    });
  }, []);

  return <LoadingMessage message="Creating new convo..." />;
};

export const Route = createFileRoute("/_app/new")({
  component: NewConvo,
  ssr: false,
});
