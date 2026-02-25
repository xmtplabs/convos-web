import { PencilIcon } from "lucide-react";
import { ConvoCard } from "@/components/convos/ConvoCard";
import { LinkButton } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";

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

  return (
    <Modal size="lg" opened={opened} onClose={onClose} title="Convo details">
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
