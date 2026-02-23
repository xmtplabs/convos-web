import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/App";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: App,
  validateSearch: (search: Record<string, unknown>): { modal?: string } => ({
    modal: typeof search.modal === "string" ? search.modal : undefined,
  }),
});
