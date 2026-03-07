import {
  Divider,
  Drawer,
  Menu,
  Text,
  UnstyledButton,
  type MantineColor,
  type MenuProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import { useIsMobile } from "@/hooks/useMobile";
import classes from "./ActionSheet.module.css";

type ActionSheetContextValue = {
  mobile: boolean;
  open: (() => void) | null;
  close: (() => void) | null;
  opened: boolean;
};

const ActionSheetContext = createContext<ActionSheetContextValue>({
  mobile: false,
  open: null,
  close: null,
  opened: false,
});

const useActionSheet = () => useContext(ActionSheetContext);

type ActionSheetProps = Pick<
  MenuProps,
  "children" | "withArrow" | "arrowPosition" | "arrowOffset" | "position"
>;

export const ActionSheet: React.FC<ActionSheetProps> & {
  Target: typeof Target;
  Dropdown: typeof Dropdown;
  Item: typeof Item;
  ItemDivider: typeof ItemDivider;
  Label: typeof Label;
} = ({ children, withArrow, arrowPosition, arrowOffset, position }) => {
  const isMobile = useIsMobile();
  const [opened, { open, close }] = useDisclosure(false);

  if (!isMobile) {
    return (
      <ActionSheetContext.Provider
        value={{ mobile: false, open: null, close: null, opened: false }}>
        <Menu
          withArrow={withArrow}
          arrowPosition={arrowPosition}
          arrowOffset={arrowOffset}
          position={position}>
          {children}
        </Menu>
      </ActionSheetContext.Provider>
    );
  }

  return (
    <ActionSheetContext.Provider value={{ mobile: true, open, close, opened }}>
      {children}
    </ActionSheetContext.Provider>
  );
};

// -- compound components --

const Target: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { mobile, open } = useActionSheet();
  const child = Children.only(children);
  if (!mobile) {
    return <Menu.Target>{child}</Menu.Target>;
  }
  if (!isValidElement(child)) {
    throw new Error("ActionSheet.Target requires a single React element");
  }
  return cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
    onClick: open ?? undefined,
  });
};

const Dropdown: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ctx = useActionSheet();
  if (!ctx.mobile) {
    return <Menu.Dropdown>{children}</Menu.Dropdown>;
  }
  return (
    <Drawer
      opened={ctx.opened}
      onClose={ctx.close ?? (() => {})}
      position="bottom"
      withCloseButton={false}
      size="auto"
      transitionProps={{
        transition: "slide-up",
        duration: 200,
        timingFunction: "ease-out",
      }}
      classNames={{
        content: classes.drawer,
        body: classes.body,
      }}>
      <ActionSheetContext.Provider value={ctx}>
        {children}
      </ActionSheetContext.Provider>
    </Drawer>
  );
};

type ItemProps = {
  children: ReactNode;
  leftSection?: ReactNode;
  color?: MantineColor;
  onClick?: () => void;
};

const Item: React.FC<ItemProps> = ({
  children,
  leftSection,
  color,
  onClick,
}) => {
  const { mobile, close } = useActionSheet();

  const handleClick = useCallback(() => {
    close?.();
    onClick?.();
  }, [close, onClick]);

  if (!mobile) {
    return (
      <Menu.Item leftSection={leftSection} color={color} onClick={onClick}>
        {children}
      </Menu.Item>
    );
  }

  return (
    <UnstyledButton className={classes.item} onClick={handleClick}>
      {leftSection && (
        <Text component="span" c={color} className={classes.icon}>
          {leftSection}
        </Text>
      )}
      <Text c={color} size="lg">
        {children}
      </Text>
    </UnstyledButton>
  );
};

const ItemDivider: React.FC = () => {
  const { mobile } = useActionSheet();
  if (!mobile) return <Menu.Divider />;
  return <Divider />;
};

const Label: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { mobile } = useActionSheet();
  if (!mobile) return <Menu.Label>{children}</Menu.Label>;
  return (
    <Text size="xs" c="dimmed" px="md" py="xs">
      {children}
    </Text>
  );
};

ActionSheet.Target = Target;
ActionSheet.Dropdown = Dropdown;
ActionSheet.Item = Item;
ActionSheet.ItemDivider = ItemDivider;
ActionSheet.Label = Label;
