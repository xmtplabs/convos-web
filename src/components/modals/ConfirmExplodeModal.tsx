import { Button, Stack, Text } from "@mantine/core";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";

export const ConfirmExplodeModal: React.FC<{
  immediate: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ immediate, onCancel, onConfirm }) => (
  <Modal
    onClose={onCancel}
    title={immediate ? "Explode now?" : "Light the fuse?"}>
    <Stack gap="md">
      <Text size="sm">
        {immediate
          ? "This convo will be destroyed immediately for everyone."
          : "The countdown can't be changed or cancelled once it starts."}
      </Text>
      <Stack gap="xxs">
        <Button
          variant="filled"
          color="red"
          size="lg"
          radius="lg"
          onClick={onConfirm}>
          {immediate ? "Explode" : "Start"}
        </Button>
        <ModalCloseButton>Cancel</ModalCloseButton>
      </Stack>
    </Stack>
  </Modal>
);
