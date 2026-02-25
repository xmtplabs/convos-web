import { createFileRoute, useRouter } from "@tanstack/react-router";
import { UnlockConvoModal } from "@/components/modals/UnlockConvoModal";

const UnlockConvo = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <UnlockConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/unlock")({
  component: UnlockConvo,
});
