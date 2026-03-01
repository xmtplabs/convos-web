import { createFileRoute, useRouter } from "@tanstack/react-router";
import { InviteModal } from "@/components/modals/InviteModal";
import { createLogger } from "@/utils/log";

const log = createLogger("invite");

const InviteConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <InviteModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/invite")({
  component: InviteConvo,
});
