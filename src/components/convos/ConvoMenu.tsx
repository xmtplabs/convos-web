import { Menu } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import {
  LockIcon,
  LockOpenIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";
import type { Convo } from "@/db";
import { MENU_ICON_SIZE } from "@/utils/constants";
import { updateConvo } from "@/utils/convos";

export type ConvoMenuProps = React.PropsWithChildren<{
  convo: Convo;
  canLock?: boolean;
}>;

export const ConvoMenu: React.FC<ConvoMenuProps> = ({
  convo,
  canLock,
  children,
}) => {
  const navigate = useNavigate();

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
              void navigate({
                to: `/convo/${convo.id}/${convo.locked ? "unlock" : "lock"}`,
              });
            }}>
            {convo.locked ? "Unlock" : "Lock"}
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<Trash2Icon size={MENU_ICON_SIZE} />}
          onClick={() => {
            void navigate({
              to: "/convo/$convoId/delete",
              params: { convoId: convo.id },
            });
          }}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
