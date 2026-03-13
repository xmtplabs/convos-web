import { createFileRoute, redirect } from "@tanstack/react-router";
import { Convo } from "@/components/convos/Convo";
import { getConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("sync");

const VALID_ACTIONS = [
  "invite",
  "delete",
  "lock",
  "unlock",
  "explode",
] as const;

export type ConvoAction = (typeof VALID_ACTIONS)[number];

export type ConvoSearch = {
  action?: ConvoAction;
};

export const Route = createFileRoute("/_app/convo/$convoId")({
  component: Convo,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ConvoSearch => ({
    action: VALID_ACTIONS.includes(search.action as ConvoAction)
      ? (search.action as ConvoAction)
      : undefined,
  }),
  loader: async ({ params }) => {
    log.trace("loader entered", { convoId: params.convoId });
    const convo = await getConvo(params.convoId);
    if (!convo) {
      log.debug("not found, redirecting", { convoId: params.convoId });
      // oxlint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" });
    }
    log.trace("loader resolved", { convoId: convo.id });
    return convo;
  },
});
