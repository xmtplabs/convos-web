import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LockConvoModal } from "@/components/modals/LockConvoModal";

const LockConvo = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <LockConvoModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/lock")({
  component: LockConvo,
});
