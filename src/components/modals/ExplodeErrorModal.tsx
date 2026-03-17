import { Stack, Text } from "@mantine/core";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { createLogger } from "@/utils/log";

const log = createLogger("explode-error-modal");

export const ExplodeErrorModal: React.FC<{
  error: string;
  onClose: () => void;
}> = ({ error, onClose }) => {
  log.trace("render");
  return (
    <Modal onClose={onClose} title="Explode Failed">
      <Stack gap="md">
        <Text size="sm">{error}</Text>
        <ModalCloseButton>OK</ModalCloseButton>
      </Stack>
    </Modal>
  );
};
