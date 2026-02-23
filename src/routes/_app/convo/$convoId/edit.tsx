import { createFileRoute, useRouter } from "@tanstack/react-router";
import { EditConvoModal } from "@/components/EditConvoModal";

const EditConvo = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <EditConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/edit")({
  component: EditConvo,
});
