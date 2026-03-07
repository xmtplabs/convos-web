import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppLockScreen } from "@/components/app/AppLockScreen";
import { ConvosList } from "@/components/convos/ConvosList";
import { AboutModal } from "@/components/modals/AboutModal";
import { DeleteAllDataModal } from "@/components/modals/DeleteAllDataModal";
import { AppLockProvider, useAppLockContext } from "@/contexts/AppLockContext";
import { NavProvider } from "@/contexts/NavContext";
import { XmtpProvider } from "@/contexts/XmtpContext";
import { useConvos } from "@/hooks/useConvos";
import { useExplodeWatcher } from "@/hooks/useExplodeWatcher";
import { useIsMobile } from "@/hooks/useMobile";
import { MainLayout } from "@/layouts/MainLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app");

const UPDATE_POLL_INTERVAL = 60 * 1000;

const AppContent = () => {
  log.trace("content render");
  const { modal } = useSearch({ from: "/_app" });
  const convos = useConvos();
  log.debug("convos loaded", { count: convos.length });
  const isMobile = useIsMobile();
  const [navOpened, setNavOpened] = useState(false);
  const openNav = useCallback(() => {
    setNavOpened(true);
  }, []);
  const closeNav = useCallback(() => {
    setNavOpened(false);
  }, []);
  const navInitialized = useRef(false);
  useExplodeWatcher();

  useEffect(() => {
    if (convos.length === 0) {
      setNavOpened(false);
      navInitialized.current = false;
    } else if (!navInitialized.current) {
      setNavOpened(!isMobile);
      navInitialized.current = true;
    }
  }, [convos]);

  // sync convo metadata to service worker for push notification handling
  useEffect(() => {
    const convosMap: Record<
      string,
      { id: string; name: string; muted: boolean }
    > = {};
    for (const c of convos) {
      if (c.xmtpId) {
        convosMap[c.xmtpId] = {
          id: c.id,
          name: c.name ?? "New Convo",
          muted: !!c.muted,
        };
      }
    }
    navigator.serviceWorker.controller?.postMessage({
      type: "sync-convos",
      convos: convosMap,
    });
  }, [convos]);

  return (
    <NavProvider value={{ navOpened, openNav, closeNav }}>
      <MainLayout
        opened={navOpened}
        aside={
          convos.length > 0 ? (
            <>
              <AppHeader />
              <ConvosList convos={convos} />
            </>
          ) : null
        }>
        <Outlet />
        {modal === "about" && <AboutModal />}
        {modal === "delete-all" && <DeleteAllDataModal />}
      </MainLayout>
    </NavProvider>
  );
};

const AppGate = () => {
  const { lockState } = useAppLockContext();
  log.trace("gate render", { lockState });

  if (lockState === "locked") {
    log.warn("locked by another tab");
    return <AppLockScreen />;
  }

  return (
    <XmtpProvider>
      <AppContent />
    </XmtpProvider>
  );
};

export const App = () => {
  log.trace("render");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const navigate = useNavigate();

  useEffect(() => {
    log.trace("mounted");
    if (!("serviceWorker" in navigator)) {
      log.debug("service worker not supported");
      return;
    }

    // if a controller already exists, this isn't a fresh install.
    // any future controllerchange means a new SW version took over.
    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (hadController) {
        log.info("update available (new service worker)");
        notifications.show({
          color: "green",
          title: "A new version is available",
          withBorder: true,
          autoClose: false,
          message: (
            <Text
              component="span"
              size="sm"
              c="blue"
              td="underline"
              style={{ cursor: "pointer" }}
              onClick={() => {
                log.info("reload clicked");
                window.location.reload();
              }}>
              Click to upgrade
            </Text>
          ),
        });
      }
    };

    // handle navigation requests from service worker (notification clicks)
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: string } | null;
      if (data?.type === "navigate" && data.url) {
        log.info("navigating from notification", { url: data.url });
        void navigate({ to: data.url });
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    navigator.serviceWorker.addEventListener("message", onMessage);

    navigator.serviceWorker
      .register(`/sw.js?v=${__SW_VERSION__}`)
      .then((registration) => {
        log.info("service worker registered");
        // poll for updates so updates are discovered without navigation
        intervalRef.current = setInterval(() => {
          registration.update().catch(() => {});
        }, UPDATE_POLL_INTERVAL);
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      navigator.serviceWorker.removeEventListener("message", onMessage);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate]);

  return (
    <AppLockProvider>
      <AppGate />
    </AppLockProvider>
  );
};
