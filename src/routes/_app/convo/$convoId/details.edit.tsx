import { createFileRoute } from "@tanstack/react-router";

const VALID_FOCUS = ["name", "description"] as const;

export type EditFocus = (typeof VALID_FOCUS)[number];

export type EditSearch = {
  focus?: EditFocus;
};

// rendered inside ConvoDetailsPanel when URL matches.
export const Route = createFileRoute("/_app/convo/$convoId/details/edit")({
  component: () => null,
  validateSearch: (search: Record<string, unknown>): EditSearch => ({
    focus: VALID_FOCUS.includes(search.focus as EditFocus)
      ? (search.focus as EditFocus)
      : undefined,
  }),
});
