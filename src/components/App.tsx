import { Outlet, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AboutModal } from "@/components/AboutModal";
import { AppHeader } from "@/components/AppHeader";
import { AppLockScreen } from "@/components/AppLockScreen";
import { ConvosList } from "@/components/ConvosList";
import { AppLockProvider, useAppLockContext } from "@/contexts/AppLockContext";
import { XmtpProvider } from "@/contexts/XmtpContext";
import { useConvos } from "@/hooks/useConvos";
import { MainLayout } from "@/layouts/MainLayout";

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
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <AppLockProvider>
      <AppGate />
    </AppLockProvider>
  );
};
