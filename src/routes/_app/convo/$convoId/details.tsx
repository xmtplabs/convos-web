import { createFileRoute } from "@tanstack/react-router";
import { ConvoDetailsPanel } from "@/components/convos/ConvoDetailsPanel";

export const Route = createFileRoute("/_app/convo/$convoId/details")({
  component: ConvoDetailsPanel,
});
