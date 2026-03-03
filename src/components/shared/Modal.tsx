import { Button, Modal as MantineModal, type ModalProps } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import classes from "./Modal.module.css";

// animation duration for closing the modal
const CLOSE_ANIMATION_DURATION = 150;

const ModalCloseContext = createContext<(() => void) | null>(null);

export const useModalClose = () => {
  const close = useContext(ModalCloseContext);
  if (!close) {
    throw new Error("useModalClose must be used within a Modal");
  }
  return close;
};

export const ModalCloseButton: React.FC<
  React.ComponentProps<typeof Button<"button">>
> = ({
  children = "Cancel",
  variant = "default",
  size = "md",
  radius = "lg",
  onClick,
  ...props
}) => {
  const close = useModalClose();
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      close();
      onClick?.(e);
    },
    [close, onClick],
  );
  return (
    <Button
      variant={variant}
      size={size}
      radius={radius}
      onClick={handleClick}
      {...props}>
      {children}
    </Button>
  );
};

export const Modal: React.FC<
  React.PropsWithChildren<Omit<ModalProps, "opened">>
> = ({ children, onClose, ...props }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // animate on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, []);

  // clean up close timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // animate out, then notify parent
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsOpen(false);
    timerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, CLOSE_ANIMATION_DURATION);
  }, []);

  return (
    <ModalCloseContext.Provider value={handleClose}>
      <MantineModal
        {...props}
        opened={isOpen}
        onClose={handleClose}
        radius="lg"
        centered={!isMobile}
        transitionProps={
          isMobile
            ? {
                transition: "slide-up",
                duration: CLOSE_ANIMATION_DURATION,
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
    </ModalCloseContext.Provider>
  );
};
