import { Menu } from "@mantine/core";
import { BombIcon } from "lucide-react";
import { MENU_ICON_SIZE } from "@/utils/constants";
import { getNextSunday } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("explode");

type ExplodeSubMenuProps = {
  onExplode: (getExpiresAt: () => Date, immediate?: boolean) => void;
  onChooseDateTime: () => void;
};

export const ExplodeSubMenu: React.FC<ExplodeSubMenuProps> = ({
  onExplode,
  onChooseDateTime,
}) => {
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
        <Menu.Item
          onClick={() => {
            log.info("explode timer selected: 60s");
            onExplode(() => new Date(Date.now() + 60 * 1000));
          }}>
          60 seconds
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            log.info("explode timer selected: 1h");
            onExplode(() => new Date(Date.now() + 60 * 60 * 1000));
          }}>
          1 hour
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            log.info("explode timer selected: 24h");
            onExplode(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
          }}>
          24 hours
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            log.info("explode timer selected: sunday");
            onExplode(() => getNextSunday());
          }}>
          Sunday at midnight
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            log.info("explode timer selected: choose date/time");
            onChooseDateTime();
          }}>
          Choose date and time
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          onClick={() => {
            log.info("explode timer selected: explode now");
            onExplode(() => new Date(), true);
          }}>
          Explode now
        </Menu.Item>
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
