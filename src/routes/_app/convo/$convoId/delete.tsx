import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DeleteConvoModal } from "@/components/DeleteConvoModal";

const DeleteConvo = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <DeleteConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/delete")({
  component: DeleteConvo,
});
