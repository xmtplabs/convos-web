import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DeleteConvoModal } from "@/components/modals/DeleteConvoModal";
import { createLogger } from "@/utils/log";

const log = createLogger("delete-convo");

const DeleteConvo = () => {
  const router = useRouter();

  log.trace("render");

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <DeleteConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/delete")({
  component: DeleteConvo,
});
