import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ExplodeConvoModal } from "@/components/modals/ExplodeConvoModal";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

const ExplodeConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <ExplodeConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/explode")({
  component: ExplodeConvo,
});
