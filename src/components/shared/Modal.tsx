import { Modal as MantineModal, type ModalProps } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useEffect, useState } from "react";
import classes from "./Modal.module.css";

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  opened,
  ...props
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  // defer opened by one frame so modals that mount with opened=true still animate
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (opened) {
      const id = requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
    setIsOpen(false);
  }, [opened]);

  return (
    <MantineModal
      {...props}
      opened={isOpen}
      radius="lg"
      centered={!isMobile}
      transitionProps={
        isMobile
          ? {
              transition: "slide-up",
              duration: 150,
              timingFunction: "ease-out",
            }
          : undefined
      }
      classNames={{
        ...classes,
        inner: isMobile ? classes.innerMobile : undefined,
        content: isMobile
          ? `${classes.content} ${classes.contentMobile}`
          : classes.content,
      }}>
      {children}
    </MantineModal>
  );
};
