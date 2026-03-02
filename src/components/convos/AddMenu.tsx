import { ActionIcon, Menu } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { LinkIcon, PlusIcon, QrCodeIcon } from "lucide-react";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createInviteSlug, getInviteUrl } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-header");

export const AddMenu: React.FC = () => {
  const { appData, convo } = useConvo();
  const inboxId = useInboxId();
  const navigate = useNavigate();

  return (
    <Menu withArrow position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="transparent">
          <PlusIcon size={24} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<LinkIcon size={14} />}
          onClick={() => {
            if (!appData) return;
            const slug = createInviteSlug(convo, appData, inboxId);
            const url = getInviteUrl(slug);
            void navigator.clipboard.writeText(url);
            log.info("invite link copied from menu");
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
      </Menu.Dropdown>
    </Menu>
  );
};
