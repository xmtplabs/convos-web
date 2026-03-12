import { Stack, Text } from "@mantine/core";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";

export const ExplodeErrorModal: React.FC<{
  error: string;
  onClose: () => void;
}> = ({ error, onClose }) => (
  <Modal onClose={onClose} title="Explode Failed">
    <Stack gap="md">
      <Text size="sm">{error}</Text>
      <ModalCloseButton>OK</ModalCloseButton>
    </Stack>
  </Modal>
);
