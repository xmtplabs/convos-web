import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LockConvoModal } from "@/components/modals/LockConvoModal";
import { createLogger } from "@/utils/log";

const log = createLogger("app-lock");

const LockConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <LockConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/lock")({
  component: LockConvo,
});
