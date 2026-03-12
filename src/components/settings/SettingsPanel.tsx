import { ActionIcon, Text } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { CustomizeView } from "@/components/settings/CustomizeView";
import { MainView } from "@/components/settings/MainView";
import { MyInfoView } from "@/components/settings/MyInfoView";
import { PanelView } from "@/components/shared/PanelView";
import { createLogger } from "@/utils/log";
import classes from "./SettingsPanel.module.css";

const log = createLogger("settings");

export const SettingsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { panel, view } = useSearch({ from: "/_app" });
  const isOpen = panel === "settings";
  const showMyInfo = view === "my-info";
  const showCustomize = view === "customize";
  const showSubpage = showMyInfo || showCustomize;

  let headerTitle = "Settings";
  if (showMyInfo) {
    headerTitle = "My info";
  }
  if (showCustomize) {
    headerTitle = "Customize";
  }

  const dirtyRef = useRef(false);
  const onDirtyChange = useCallback((dirty: boolean) => {
    log.debug("onDirtyChange", { dirty });
    dirtyRef.current = dirty;
  }, []);

  log.trace("render", { isOpen });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  const close = () => {
    if (dirtyRef.current) {
      log.debug("close blocked, form is dirty");
      return;
    }
    log.info("panel closed");
    void navigate({ to: ".", search: { panel: undefined, view: undefined } });
  };

  return (
    <>
      <div
        className={classes.backdrop}
        data-state={isOpen ? "open" : "closed"}
        onClick={close}
      />
      <div className={classes.panel} data-state={isOpen ? "open" : "closed"}>
        <div className={classes.header}>
          {showSubpage && (
            <ActionIcon
              variant="subtle"
              onClick={() => {
                if (dirtyRef.current) {
                  log.debug("back blocked, form is dirty");
                  return;
                }
                void navigate({
                  to: ".",
                  search: (prev) => ({ ...prev, view: undefined }),
                });
              }}>
              <ArrowLeftIcon size={20} />
            </ActionIcon>
          )}
          <Text fw={600} size="lg" className={classes.headerTitle}>
            {headerTitle}
          </Text>
          <ActionIcon variant="subtle" onClick={close}>
            <XIcon size={20} />
          </ActionIcon>
        </div>
        <div className={classes.pages}>
          <PanelView name="main" active={!showSubpage} offscreen="left">
            <MainView />
          </PanelView>
          <PanelView name="my-info" active={showMyInfo}>
            <MyInfoView onDirtyChange={onDirtyChange} />
          </PanelView>
          <PanelView name="customize" active={showCustomize}>
            <CustomizeView />
          </PanelView>
        </div>
      </div>
    </>
  );
};
