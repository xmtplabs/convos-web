import { Outlet, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppLockScreen } from "@/components/app/AppLockScreen";
import { ConvosList } from "@/components/convos/ConvosList";
import { ConvoInfoModal } from "@/components/modals/ConvoInfoModal";
import { DeleteAllDataModal } from "@/components/modals/DeleteAllDataModal";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useAppLockContext } from "@/contexts/AppLockContext";
import { useNav } from "@/contexts/NavContext";
import { useActiveConvo } from "@/hooks/useActiveConvo";
import { useConvos } from "@/hooks/useConvos";
import { useExplodeWatcher } from "@/hooks/useExplodeWatcher";
import { useLogConfig } from "@/hooks/useLogConfig";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useServiceWorkerSync } from "@/hooks/useServiceWorkerSync";
import { useSwDecrypt } from "@/hooks/useSwDecrypt";
import { MainLayout } from "@/layouts/MainLayout";
import { createLogger } from "@/utils/log";

const log = createLogger("app");

const AppMain = () => {
  log.trace("content render");
  const { modal } = useSearch({ from: "/_app" });
  const convos = useConvos();
  const { setHasConvos } = useNav();
  log.debug("convos loaded", { count: convos.length });
  useActiveConvo();
  useSwDecrypt();
  useExplodeWatcher();
  useServiceWorkerSync(convos);

  useEffect(() => {
    setHasConvos(convos.length > 0);
  }, [convos.length, setHasConvos]);

  return (
    <>
      <MainLayout
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
    </>
  );
};

export const App = () => {
  log.trace("render");
  useLogConfig();
  useServiceWorker();

  const { lockState } = useAppLockContext();
  if (lockState === "locked") {
    log.warn("locked by another tab");
    return <AppLockScreen />;
  }

  return <AppMain />;
};
