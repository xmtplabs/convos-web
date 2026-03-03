import { Menu } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
  BombIcon,
  InfoIcon,
  LockIcon,
  LockOpenIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";
import { AddMenuItems } from "@/components/convos/AddMenu";
import { ExplodeSubMenu } from "@/components/convos/ExplodeSubMenu";
import type { Convo } from "@/db";
import { useIsMobile } from "@/hooks/useMobile";
import type { AppData } from "@/utils/appData";
import { MENU_ICON_SIZE } from "@/utils/constants";
import { updateConvo } from "@/utils/convos";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-menu");

export type ConvoMenuProps = React.PropsWithChildren<{
  convo: Convo;
  appData?: AppData | null;
  canLock?: boolean;
  canAddMembers?: boolean;
  canExplode?: boolean;
  onExplode?: (getExpiresAt: () => Date, immediate?: boolean) => void;
  onToggleDetails?: () => void;
}>;

export const ConvoMenu: React.FC<ConvoMenuProps> = ({
  convo,
  appData,
  canLock,
  canAddMembers,
  canExplode,
  onExplode,
  onToggleDetails,
  children,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hasActiveTimer = appData?.expiresAtUnix != null;

  return (
    <Menu withArrow arrowPosition="side" arrowOffset={14} position="bottom-end">
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            convo.faved ? (
              <StarOffIcon size={MENU_ICON_SIZE} />
            ) : (
              <StarIcon size={MENU_ICON_SIZE} />
            )
          }
          onClick={() => {
            log.info(convo.faved ? "unfav clicked" : "fav clicked", {
              convoId: convo.id,
            });
            void updateConvo(convo.id, { faved: !convo.faved });
          }}>
          {convo.faved ? "Unfav" : "Fav"}
        </Menu.Item>
        {canLock && (
          <Menu.Item
            leftSection={
              convo.locked ? (
                <LockOpenIcon size={MENU_ICON_SIZE} />
              ) : (
                <LockIcon size={MENU_ICON_SIZE} />
              )
            }
            onClick={() => {
              log.info(convo.locked ? "unlock clicked" : "lock clicked", {
                convoId: convo.id,
              });
              void navigate({
                to: ".",
                search: { action: convo.locked ? "unlock" : "lock" },
              });
            }}>
            {convo.locked ? "Unlock" : "Lock"}
          </Menu.Item>
        )}
        {canExplode && onExplode && !hasActiveTimer && (
          <ExplodeSubMenu
            onExplode={onExplode}
            onChooseDateTime={() => {
              void navigate({
                to: ".",
                search: { action: "explode" },
              });
            }}
          />
        )}
        {canExplode && onExplode && hasActiveTimer && (
          <Menu.Item
            color="red"
            leftSection={<BombIcon size={MENU_ICON_SIZE} />}
            onClick={() => {
              log.info("explode now clicked", { convoId: convo.id });
              onExplode(() => new Date(), true);
            }}>
            Explode now
          </Menu.Item>
        )}
        {isMobile && canAddMembers && !convo.locked && (
          <>
            <Menu.Divider />
            <AddMenuItems />
          </>
        )}
        {isMobile && onToggleDetails && (
          <>
            <Menu.Divider />
            <Menu.Item
              leftSection={<InfoIcon size={MENU_ICON_SIZE} />}
              onClick={onToggleDetails}>
              Details
            </Menu.Item>
          </>
        )}
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<Trash2Icon size={MENU_ICON_SIZE} />}
          onClick={() => {
            log.info("delete clicked", { convoId: convo.id });
            void navigate({
              to: ".",
              search: { action: "delete" },
            });
          }}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
