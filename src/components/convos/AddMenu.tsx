import { ActionIcon, Menu } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { LinkIcon, PlusIcon, QrCodeIcon } from "lucide-react";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createInviteSlug, getInviteUrl } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-header");

export const AddMenuItems: React.FC = () => {
  const { appData, convo } = useConvo();
  const inboxId = useInboxId();
  const navigate = useNavigate();

  return (
    <>
      <Menu.Item
        leftSection={<LinkIcon size={14} />}
        onClick={() => {
          if (!appData) return;
          const slug = createInviteSlug(convo, appData, inboxId);
          const url = getInviteUrl(slug);
          void navigator.clipboard.writeText(url);
          log.info("invite link copied from menu");
          notifications.show({
            message: "Invite link copied to clipboard",
            color: "green",
          });
        }}>
        Copy invite link
      </Menu.Item>
      <Menu.Item
        leftSection={<QrCodeIcon size={14} />}
        onClick={() =>
          void navigate({
            to: ".",
            search: { action: "invite" },
          })
        }>
        Show convo QR code
      </Menu.Item>
    </>
  );
};

export const AddMenu: React.FC = () => {
  return (
    <Menu withArrow position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="transparent">
          <PlusIcon size={24} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <AddMenuItems />
      </Menu.Dropdown>
    </Menu>
  );
};
