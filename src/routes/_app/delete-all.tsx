import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DeleteAllDataModal } from "@/components/modals/DeleteAllDataModal";
import { createLogger } from "@/utils/log";

const log = createLogger("delete-all");

const DeleteAll = () => {
  log.trace("render");
  const router = useRouter();

  const onClose = () => {
    log.info("closed");
    router.history.back();
  };

  return <DeleteAllDataModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/delete-all")({
  component: DeleteAll,
});
