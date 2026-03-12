import { ActionIcon, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { LinkIcon, PlusIcon, QrCodeIcon } from "lucide-react";
import { ActionSheet } from "@/components/shared/ActionSheet";
import { useConvo } from "@/hooks/useConvo";
import { useInboxId } from "@/hooks/useInboxId";
import { createInviteSlug, getInviteUrl } from "@/utils/invite";
import { createLogger } from "@/utils/log";

const log = createLogger("convo-header");

export const InviteMenuItems: React.FC = () => {
  const { appData, convo } = useConvo();
  const inboxId = useInboxId();
  const navigate = useNavigate();

  return (
    <>
      <ActionSheet.Item
        leftSection={<LinkIcon size={16} />}
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
        <Stack gap="0">
          <Text size="sm">Invite link</Text>
          <Text size="xs" c="dimmed">
            Copy to clipboard
          </Text>
        </Stack>
      </ActionSheet.Item>
      <ActionSheet.Item
        leftSection={<QrCodeIcon size={16} />}
        onClick={() =>
          void navigate({
            to: ".",
            search: { action: "invite" },
          })
        }>
        <Stack gap="0">
          <Text size="sm">Convo code</Text>
          <Text size="xs" c="dimmed">
            Show QR code
          </Text>
        </Stack>
      </ActionSheet.Item>
    </>
  );
};

export type InviteMenuProps = {
  visibleFrom?: string;
};

export const InviteMenu: React.FC<InviteMenuProps> = ({ visibleFrom }) => {
  return (
    <ActionSheet withArrow position="bottom-end">
      <ActionSheet.Target>
        <ActionIcon variant="transparent" visibleFrom={visibleFrom} radius="xl">
          <PlusIcon size={24} />
        </ActionIcon>
      </ActionSheet.Target>
      <ActionSheet.Dropdown>
        <InviteMenuItems />
      </ActionSheet.Dropdown>
    </ActionSheet>
  );
};
