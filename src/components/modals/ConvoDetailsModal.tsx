import { PencilIcon } from "lucide-react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import { LinkButton } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-details");

type ConvoDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
};

export const ConvoDetailsModal: React.FC<ConvoDetailsModalProps> = ({
  opened,
  onClose,
}) => {
  const { convo, permissions } = useConvo();
  const canEditName = permissions?.canEditName ?? false;
  const canEditDescription = permissions?.canEditDescription ?? false;
  const canEditInfo = canEditName || canEditDescription;

  log.trace("render", { convoId: convo.id, canEditInfo });

  return (
    <Modal
      size="lg"
      opened={opened}
      onClose={() => {
        log.info("closed", { convoId: convo.id });
        onClose();
      }}
      title="Convo details">
      <ConvoCard convo={convo}>
        {canEditInfo && (
          <LinkButton
            to="/convo/$convoId/edit"
            params={{ convoId: convo.id }}
            variant="filled"
            radius="md"
            leftSection={<PencilIcon size={14} />}
            size="xs">
            Edit info
          </LinkButton>
        )}
      </ConvoCard>
    </Modal>
  );
};
