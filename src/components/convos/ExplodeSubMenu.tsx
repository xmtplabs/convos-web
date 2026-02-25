import { Menu } from "@mantine/core";
import { BombIcon } from "lucide-react";
import { MENU_ICON_SIZE } from "@/utils/constants";

export const ExplodeSubMenu = () => {
  return (
    <Menu.Sub openDelay={150} closeDelay={150}>
      <Menu.Sub.Target>
        <Menu.Sub.Item
          color="red"
          leftSection={<BombIcon size={MENU_ICON_SIZE} />}>
          Explode
        </Menu.Sub.Item>
      </Menu.Sub.Target>
      <Menu.Sub.Dropdown>
        <Menu.Label>Start an unstoppable countdown</Menu.Label>
        <Menu.Item>60 seconds</Menu.Item>
        <Menu.Item>1 hour</Menu.Item>
        <Menu.Item>24 hours</Menu.Item>
        <Menu.Item>Sunday at midnight</Menu.Item>
        <Menu.Item>Choose date and time</Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red">Explode now</Menu.Item>
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
