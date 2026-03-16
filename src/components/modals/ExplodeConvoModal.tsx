import { Button, Stack, Text } from "@mantine/core";
import { DateTimePicker, type DateStringValue } from "@mantine/dates";
import { useState } from "react";
import { Modal, ModalCloseButton } from "@/components/shared/Modal";
import { useConvo } from "@/hooks/useConvo";
import { createLogger } from "@/utils/log";

const log = createLogger("explode-convo-modal");

type ExplodeConvoModalProps = {
  onClose: () => void;
};

export const ExplodeConvoModal: React.FC<ExplodeConvoModalProps> = ({
  onClose,
}) => {
  const { explode, permissions } = useConvo();
  const [date, setDate] = useState<DateStringValue | null>(null);

  const minDate = new Date(Date.now() + 60 * 1000);

  log.trace("render", {
    hasDate: !!date,
    canRemoveMembers: permissions?.canRemoveMembers,
  });

  const handleExplode = () => {
    if (!date || !permissions?.canRemoveMembers) {
      log.debug("explode action blocked", {
        hasDate: !!date,
        canRemoveMembers: permissions?.canRemoveMembers,
      });
      return;
    }
    log.info("explode action triggered", { date });
    explode(() => new Date(date));
    onClose();
  };

  return (
    <Modal
      onClose={() => {
        log.info("explode modal closed");
        onClose();
      }}
      size="sm"
      title="Explode">
      <Stack gap="md">
        <Text size="sm">
          Choose when this convo will be destroyed for everyone.
        </Text>
        <DateTimePicker
          label="Explode at"
          placeholder="Pick date and time"
          value={date}
          onChange={(val) => {
            log.info("explode date selected", { date: val });
            setDate(val);
          }}
          minDate={minDate}
        />
        <Stack gap="xxs">
          <Button
            variant="filled"
            color="red"
            size="lg"
            radius="lg"
            onClick={handleExplode}
            disabled={!date}>
            Set Explode Timer
          </Button>
          <ModalCloseButton>Cancel</ModalCloseButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
