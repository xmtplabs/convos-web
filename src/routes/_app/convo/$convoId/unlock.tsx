import { createFileRoute, useRouter } from "@tanstack/react-router";
import { UnlockConvoModal } from "@/components/modals/UnlockConvoModal";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

const UnlockConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <UnlockConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/unlock")({
  component: UnlockConvo,
});
