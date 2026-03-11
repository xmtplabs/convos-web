import { ActionIcon, Stack, Text, Title } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Quickname } from "@/components/app/Quickname";
import { LinkButton } from "@/components/shared/Button";
import { GroupedList, GroupedListItem } from "@/components/shared/GroupedList";
import { useConvos } from "@/hooks/useConvos";
import { createLogger } from "@/utils/log";
import classes from "./SettingsPanel.module.css";

const log = createLogger("settings");

export const SettingsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { panel } = useSearch({ from: "/_app" });
  const convos = useConvos();
  const hasConvos = convos.length > 0;
  const isOpen = panel === "settings";

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
          <Text fw={600} size="lg" className={classes.headerTitle}>
            Settings
          </Text>
          <ActionIcon variant="subtle" onClick={close}>
            <XIcon size={20} />
          </ActionIcon>
        </div>
        <div className={classes.pages}>
          <div className={classes.page} data-page="main">
            <Stack gap="md">
              <Stack gap="xs">
                <Title order={3}>My info</Title>
                <Stack gap="xxxs">
                  <Text size="sm">Private unless you choose to share it</Text>
                  <Text size="xs" c="dimmed">
                    Your info is stored on your device only
                  </Text>
                </Stack>
                <Quickname onDirtyChange={onDirtyChange} />
              </Stack>
              <GroupedList
                header={
                  <Text size="sm" c="dimmed" fw={500} ml="md">
                    About
                  </Text>
                }
                footer={
                  <Text size="xs" c="dimmed" ml="md">
                    Made in the open by XMTP Labs
                  </Text>
                }>
                <GroupedListItem href="https://xmtp.org/">
                  <Text size="sm" flex={1}>
                    Secured by XMTP
                  </Text>
                  <ExternalLinkIcon size={16} />
                </GroupedListItem>
                <GroupedListItem href="https://hq.convos.org/privacy-and-terms">
                  <Text size="sm" flex={1}>
                    Privacy &amp; Terms
                  </Text>
                  <ExternalLinkIcon size={16} />
                </GroupedListItem>
              </GroupedList>
              <LinkButton
                to="."
                search={(prev) => ({ ...prev, modal: "delete-all" })}
                variant="filled"
                color="red"
                size="lg"
                radius="lg"
                disabled={!hasConvos}>
                Delete all data
              </LinkButton>
            </Stack>
          </div>
        </div>
      </div>
    </>
  );
};
