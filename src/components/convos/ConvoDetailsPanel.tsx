import { ActionIcon, Stack, Text } from "@mantine/core";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { ConvoDetailsActions } from "@/components/convos/ConvoDetailsActions";
import { ConvoDetailsProfile } from "@/components/convos/ConvoDetailsProfile";
import { ConvoPreferences } from "@/components/convos/ConvoPreferences";
import { EditConvoPanel } from "@/components/convos/EditConvoPanel";
import { MembersList } from "@/components/shared/MembersList";
import { PanelView } from "@/components/shared/PanelView";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";
import classes from "./ConvoDetailsPanel.module.css";

const log = createLogger("convo-details");

export const ConvoDetailsPanel: React.FC = () => {
  const { convo, detailsOpen, toggleDetails } = useConvo();
  const navigate = useNavigate();
  const location = useLocation();

  const showMembers = location.pathname.endsWith("/details/members");
  const showEdit = location.pathname.endsWith("/details/edit");
  const showSubpage = showMembers || showEdit;

  let headerTitle = "Convo details";
  if (showEdit) {
    headerTitle = "Edit convo";
  } else if (showMembers) {
    headerTitle = "All members";
  }

  log.trace("render", {
    convoId: convo.id,
    detailsOpen,
    showMembers,
    showEdit,
  });

  return (
    <div className={classes.panel} data-state={detailsOpen ? "open" : "closed"}>
      <div className={classes.header}>
        {showSubpage && (
          <ActionIcon
            variant="subtle"
            onClick={() =>
              void navigate({
                to: "/convo/$convoId/details",
                params: { convoId: convo.id },
              })
            }>
            <ArrowLeftIcon size={20} />
          </ActionIcon>
        )}
        <Text fw={600} size="lg" className={classes.headerTitle}>
          {headerTitle}
        </Text>
        <ActionIcon variant="subtle" onClick={toggleDetails}>
          <XIcon size={20} />
        </ActionIcon>
      </div>
      <div className={classes.pages}>
        <PanelView name="details" active={!showSubpage} offscreen="left">
          <Stack gap="lg">
            <ConvoDetailsProfile />
            <ConvoDetailsActions />
            <MembersList />
            <ConvoPreferences />
          </Stack>
        </PanelView>
        <PanelView name="members" active={showMembers}>
          <MembersList maxDisplay={Infinity} />
        </PanelView>
        <PanelView name="edit" active={showEdit}>
          <EditConvoPanel />
        </PanelView>
      </div>
    </div>
  );
};
