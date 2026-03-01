import { createFileRoute, useRouter } from "@tanstack/react-router";
import { EditConvoModal } from "@/components/modals/EditConvoModal";
import { createLogger } from "@/utils/log";

const log = createLogger("edit-convo");

const EditConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <EditConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/edit")({
  component: EditConvo,
});
