import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ConvoDetailsModal } from "@/components/modals/ConvoDetailsModal";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-details");

const ConvoDetails = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <ConvoDetailsModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/details")({
  component: ConvoDetails,
});
