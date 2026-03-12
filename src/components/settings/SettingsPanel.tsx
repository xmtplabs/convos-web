import { ActionIcon, Text } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { CustomizeView } from "@/components/settings/CustomizeView";
import { MainView } from "@/components/settings/MainView";
import { PanelView } from "@/components/shared/PanelView";
import { createLogger } from "@/utils/log";
import classes from "./SettingsPanel.module.css";

const log = createLogger("settings");

export const SettingsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { panel, view } = useSearch({ from: "/_app" });
  const isOpen = panel === "settings";
  const showCustomize = view === "customize";

  const dirtyRef = useRef(false);
  const onDirtyChange = useCallback((dirty: boolean) => {
    log.debug("onDirtyChange", { dirty });
    dirtyRef.current = dirty;
  }, []);

  log.trace("render", { isOpen });

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
      />
      <div className={classes.panel} data-state={isOpen ? "open" : "closed"}>
        <div className={classes.header}>
          {showCustomize && (
            <ActionIcon
              variant="subtle"
              onClick={() =>
                void navigate({
                  to: ".",
                  search: (prev) => ({ ...prev, view: undefined }),
                })
              }>
              <ArrowLeftIcon size={20} />
            </ActionIcon>
          )}
          <Text fw={600} size="lg" className={classes.headerTitle}>
            {showCustomize ? "Customize" : "Settings"}
          </Text>
          <ActionIcon variant="subtle" onClick={close}>
            <XIcon size={20} />
          </ActionIcon>
        </div>
        <div className={classes.pages}>
          <PanelView name="main" active={!showCustomize} offscreen="left">
            <MainView onDirtyChange={onDirtyChange} />
          </PanelView>
          <PanelView name="customize" active={showCustomize}>
            <CustomizeView />
          </PanelView>
        </div>
      </div>
    </>
  );
};
