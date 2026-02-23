import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DeleteAllDataModal } from "@/components/DeleteAllDataModal";

const DeleteAll = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <DeleteAllDataModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/delete-all")({
  component: DeleteAll,
});
