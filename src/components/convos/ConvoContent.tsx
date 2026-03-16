import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { ConvoDetailsPanel } from "@/components/convos/ConvoDetailsPanel";
import { ConvoHeader } from "@/components/convos/ConvoHeader";
import { Composer } from "@/components/messages/Composer";
import { MessageList } from "@/components/messages/MessageList";
import { ConfirmExplodeModal } from "@/components/modals/ConfirmExplodeModal";
import { DeleteConvoModal } from "@/components/modals/DeleteConvoModal";
import { ExplodeConvoModal } from "@/components/modals/ExplodeConvoModal";
import { ExplodeErrorModal } from "@/components/modals/ExplodeErrorModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { LockConvoModal } from "@/components/modals/LockConvoModal";
import { UnlockConvoModal } from "@/components/modals/UnlockConvoModal";
import { useConvoMessaging } from "@/contexts/ConvoMessagingContext";
import { useConvo } from "@/hooks/useConvo";
import { useConvoDetails } from "@/hooks/useConvoDetails";
import { ConvoLayout } from "@/layouts/ConvoLayout";
import { Route } from "@/routes/_app/convo/$convoId";

export const ConvoContent = () => {
  const ctx = useConvo();
  const { messages } = useConvoMessaging();
  const { detailsOpen } = useConvoDetails(ctx.convo.id);
  const { action } = Route.useSearch();
  const navigate = useNavigate();

  const closeModal = useCallback(() => {
    void navigate({
      to: ".",
      search: {},
    });
  }, [navigate]);

  return (
    <>
      <ConvoLayout
        header={<ConvoHeader />}
        footer={<Composer />}
        loading={ctx.exploding}
        detailsOpen={detailsOpen}>
        <MessageList messages={messages} />
      </ConvoLayout>
      <ConvoDetailsPanel />
      {ctx.pendingExplode != null && (
        <ConfirmExplodeModal
          immediate={ctx.pendingExplode.immediate}
          onCancel={ctx.cancelExplode}
          onConfirm={ctx.confirmExplode}
        />
      )}
      {ctx.explodeError != null && (
        <ExplodeErrorModal
          error={ctx.explodeError}
          onClose={ctx.clearExplodeError}
        />
      )}
      {action === "invite" && <InviteModal onClose={closeModal} />}
      {action === "delete" && <DeleteConvoModal onClose={closeModal} />}
      {action === "lock" && <LockConvoModal onClose={closeModal} />}
      {action === "unlock" && <UnlockConvoModal onClose={closeModal} />}
      {action === "explode" && <ExplodeConvoModal onClose={closeModal} />}
    </>
  );
};
