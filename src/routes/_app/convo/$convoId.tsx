import { createFileRoute, redirect } from "@tanstack/react-router";
import { Convo } from "@/components/convos/Convo";
import { getConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("sync");

export const Route = createFileRoute("/_app/convo/$convoId")({
  component: Convo,
  ssr: false,
  loader: async ({ params }) => {
    log.trace("loader entered", { convoId: params.convoId });
    const convo = await getConvo(params.convoId);
    if (!convo) {
      log.debug("not found, redirecting", { convoId: params.convoId });
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" });
    }
    log.trace("loader resolved", { convoId: convo.id });
    return convo;
  },
});
