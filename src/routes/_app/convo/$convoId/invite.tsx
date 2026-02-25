import { createFileRoute, useRouter } from "@tanstack/react-router";
import { InviteModal } from "@/components/modals/InviteModal";

const InviteConvo = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <InviteModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/invite")({
  component: InviteConvo,
});
