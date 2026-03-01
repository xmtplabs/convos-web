import { createRouter } from "@tanstack/react-router";
import { createLogger } from "@/utils/log";
import { routeTree } from "./routeTree.gen";

const log = createLogger("router");

// create a new router instance
export const getRouter = () => {
  log.trace("creating");
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  router.subscribe("onBeforeNavigate", ({ toLocation }) => {
    log.info("navigating to", toLocation.pathname);
  });

  router.subscribe("onBeforeLoad", ({ toLocation }) => {
    log.info("beforeLoad", toLocation.pathname);
  });

  router.subscribe("onLoad", ({ toLocation }) => {
    log.info("loaded", toLocation.pathname);
  });

  router.subscribe("onBeforeRouteMount", ({ toLocation }) => {
    log.info("beforeRouteMount", toLocation.pathname);
  });

  router.subscribe("onResolved", ({ toLocation }) => {
    log.info("resolved", toLocation.pathname);
  });

  // watchdog: if router hasn't resolved within 5s, dump state (client-only)
  if (typeof window !== "undefined") {
    let resolved = false;
    router.subscribe("onResolved", () => {
      resolved = true;
    });
    setTimeout(() => {
      if (!resolved) {
        const s = router.state;
        log.error("WATCHDOG — not resolved after 5s", {
          status: s.status,
          isLoading: s.isLoading,
          location: s.location.pathname,
        });
        for (const m of s.matches) {
          log.error("WATCHDOG match", {
            routeId: m.routeId,
            status: m.status,
            isFetching: m.isFetching,
            error: m.error
              ? m.error instanceof Error
                ? m.error.message + (m.error.stack ? "\n" + m.error.stack : "")
                : String(m.error as unknown)
              : null,
          });
        }
      }
    }, 5000);
  }

  log.info("created");
  return router;
};
