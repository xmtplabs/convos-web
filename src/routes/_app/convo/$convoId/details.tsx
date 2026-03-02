import { createFileRoute } from "@tanstack/react-router";

// panel is rendered in ConvoContent (always mounted for slide animation).
// this route exists so /details is a valid URL that drives detailsOpen state.
export const Route = createFileRoute("/_app/convo/$convoId/details")({
  component: () => null,
});
