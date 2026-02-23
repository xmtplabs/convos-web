import { createFileRoute, redirect } from "@tanstack/react-router";
import { Convo } from "@/components/Convo";
import { getConvo } from "@/utils/convos";

export const Route = createFileRoute("/_app/convo/$convoId")({
  component: Convo,
  ssr: false,
  loader: async ({ params }) => {
    const convo = await getConvo(params.convoId);
    if (!convo) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/" });
    }
    return convo;
  },
});
