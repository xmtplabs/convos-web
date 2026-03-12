import { createFileRoute } from "@tanstack/react-router";
import { InviteProcess } from "@/components/invite/InviteProcess";

export const Route = createFileRoute("/_app/i/$slug")({
  component: InviteProcess,
  ssr: false,
});
