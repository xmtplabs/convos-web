import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ConvoDetailsModal } from "@/components/modals/ConvoDetailsModal";

const ConvoDetails = () => {
  const router = useRouter();

  const onClose = () => {
    router.history.back();
  };

  return <ConvoDetailsModal opened onClose={onClose} />;
};

export const Route = createFileRoute("/_app/convo/$convoId/details")({
  component: ConvoDetails,
});
