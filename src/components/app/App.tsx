import { Outlet, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppLockScreen } from "@/components/app/AppLockScreen";
import { ConvosList } from "@/components/convos/ConvosList";
import { ConvoInfoModal } from "@/components/modals/ConvoInfoModal";
import { DeleteAllDataModal } from "@/components/modals/DeleteAllDataModal";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { AppLockProvider, useAppLockContext } from "@/contexts/AppLockContext";
import { NavProvider } from "@/contexts/NavContext";
import { XmtpProvider } from "@/contexts/XmtpContext";
import { useConvos } from "@/hooks/useConvos";
import { useExplodeWatcher } from "@/hooks/useExplodeWatcher";
import { useLogConfig } from "@/hooks/useLogConfig";
import { useIsMobile } from "@/hooks/useMobile";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useServiceWorkerSync } from "@/hooks/useServiceWorkerSync";
import { MainLayout } from "@/layouts/MainLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app");

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
  useServiceWorkerSync(convos);

  useEffect(() => {
    if (convos.length === 0) {
      setNavOpened(false);
      navInitialized.current = false;
    } else if (!navInitialized.current) {
      setNavOpened(!isMobile);
      navInitialized.current = true;
    }
  }, [convos, isMobile]);

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
        {modal === "delete-all" && <DeleteAllDataModal />}
        {modal === "convo-info" && <ConvoInfoModal />}
      </MainLayout>
      <SettingsPanel />
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
  useLogConfig();
  useServiceWorker();

  return (
    <AppLockProvider>
      <AppGate />
    </AppLockProvider>
  );
};
