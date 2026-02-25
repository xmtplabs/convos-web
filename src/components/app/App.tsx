import { Outlet, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AboutModal } from "@/components/AboutModal";
import { AppHeader } from "@/components/app/AppHeader";
import { AppLockScreen } from "@/components/app/AppLockScreen";
import { UpdateNotification } from "@/components/app/UpdateNotification";
import { ConvosList } from "@/components/ConvosList";
import { AppLockProvider, useAppLockContext } from "@/contexts/AppLockContext";
import { XmtpProvider } from "@/contexts/XmtpContext";
import { useConvos } from "@/hooks/useConvos";
import { MainLayout } from "@/layouts/MainLayout";

const UPDATE_POLL_INTERVAL = 5 * 60 * 1000;

const AppContent = () => {
  const { modal } = useSearch({ from: "/_app" });
  const convos = useConvos();
  const [navOpened, setNavOpened] = useState(false);

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

  if (lockState === "locked") {
    return <AppLockScreen />;
  }

  return (
    <XmtpProvider>
      <AppContent />
    </XmtpProvider>
  );
};

export const App = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // If a controller already exists, this isn't a fresh install.
    // Any future controllerchange means a new SW version took over.
    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (hadController) {
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
