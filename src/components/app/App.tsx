import { Outlet, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppLockScreen } from "@/components/app/AppLockScreen";
import { UpdateNotification } from "@/components/app/UpdateNotification";
import { ConvosList } from "@/components/convos/ConvosList";
import { AboutModal } from "@/components/modals/AboutModal";
import { AppLockProvider, useAppLockContext } from "@/contexts/AppLockContext";
import { XmtpProvider } from "@/contexts/XmtpContext";
import { useConvos } from "@/hooks/useConvos";
import { useExplodeWatcher } from "@/hooks/useExplodeWatcher";
import { MainLayout } from "@/layouts/MainLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app");

const UPDATE_POLL_INTERVAL = 5 * 60 * 1000;

const AppContent = () => {
  log.trace("content render");
  const { modal } = useSearch({ from: "/_app" });
  const convos = useConvos();
  log.debug("convos loaded", { count: convos.length });
  const [navOpened, setNavOpened] = useState(false);
  useExplodeWatcher();

  useEffect(() => {
    setNavOpened(convos.length > 0);
  }, [convos]);

  return (
    <MainLayout opened={navOpened} aside={<ConvosList convos={convos} />}>
      <AppHeader />
      <Outlet />
      {modal === "about" && <AboutModal />}
    </MainLayout>
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
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

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
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <AppLockProvider>
      {updateAvailable && (
        <UpdateNotification
          onClose={() => {
            setUpdateAvailable(false);
          }}
        />
      )}
      <AppGate />
    </AppLockProvider>
  );
};
