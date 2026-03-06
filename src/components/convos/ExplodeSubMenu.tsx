import { Menu } from "@mantine/core";
import { BombIcon } from "lucide-react";
import { ActionSheet } from "@/components/shared/ActionSheet";
import { MENU_ICON_SIZE } from "@/utils/constants";
import { getNextSunday } from "@/utils/explode";
import { createLogger } from "@/utils/log";

const log = createLogger("explode-menu");

type ExplodeItemsProps = {
  onExplode: (getExpiresAt: () => Date, immediate?: boolean) => void;
  onChooseDateTime: () => void;
};

export const ExplodeItems: React.FC<ExplodeItemsProps> = ({
  onExplode,
  onChooseDateTime,
}) => {
  return (
    <>
      <ActionSheet.Label>Start an unstoppable countdown</ActionSheet.Label>
      <ActionSheet.Item
        onClick={() => {
          log.info("explode timer selected: 60s");
          onExplode(() => new Date(Date.now() + 60 * 1000));
        }}>
        60 seconds
      </ActionSheet.Item>
      <ActionSheet.Item
        onClick={() => {
          log.info("explode timer selected: 1h");
          onExplode(() => new Date(Date.now() + 60 * 60 * 1000));
        }}>
        1 hour
      </ActionSheet.Item>
      <ActionSheet.Item
        onClick={() => {
          log.info("explode timer selected: 24h");
          onExplode(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
        }}>
        24 hours
      </ActionSheet.Item>
      <ActionSheet.Item
        onClick={() => {
          log.info("explode timer selected: sunday");
          onExplode(() => getNextSunday());
        }}>
        Sunday at midnight
      </ActionSheet.Item>
      <ActionSheet.Item
        onClick={() => {
          log.info("explode timer selected: choose date/time");
          onChooseDateTime();
        }}>
        Choose date and time
      </ActionSheet.Item>
      <ActionSheet.ItemDivider />
      <ActionSheet.Item
        color="red"
        onClick={() => {
          log.info("explode timer selected: explode now");
          onExplode(() => new Date(), true);
        }}>
        Explode now
      </ActionSheet.Item>
    </>
  );
};

export const ExplodeSubMenu: React.FC<ExplodeItemsProps> = (props) => {
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
        <ExplodeItems {...props} />
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
