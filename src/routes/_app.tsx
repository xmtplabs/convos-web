import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/app/App";
import { createLogger } from "@/utils/log";

const log = createLogger("app");

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: App,
  beforeLoad: ({ location }) => {
    log.trace("beforeLoad", { pathname: location.pathname });
  },
  validateSearch: (search: Record<string, unknown>): { modal?: string } => ({
    modal: typeof search.modal === "string" ? search.modal : undefined,
  }),
});
