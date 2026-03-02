import { createFileRoute } from "@tanstack/react-router";

// rendered inside ConvoDetailsPanel when URL matches.
export const Route = createFileRoute("/_app/convo/$convoId/details/members")({
  component: () => null,
});
