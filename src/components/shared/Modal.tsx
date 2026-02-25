import { Modal as MantineModal, type ModalProps } from "@mantine/core";
import classes from "./Modal.module.css";

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  ...props
}) => {
  return (
    <MantineModal {...props} radius="lg" centered classNames={classes}>
      {children}
    </MantineModal>
  );
};
