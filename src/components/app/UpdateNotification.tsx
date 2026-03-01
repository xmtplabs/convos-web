import { Notification, Text } from "@mantine/core";
import { RefreshCwIcon } from "lucide-react";
import { createLogger } from "@/utils/log";
import classes from "./UpdateNotification.module.css";

const log = createLogger("update");

export type UpdateNotificationProps = {
  onClose: () => void;
};

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onClose,
}) => {
  log.trace("render");

  return (
    <Notification
      icon={<RefreshCwIcon size={18} />}
      color="green"
      title="A new version is available"
      withBorder
      onClose={onClose}
      className={classes.root}>
      <Text
        component="span"
        size="sm"
        c="blue"
        td="underline"
        style={{ cursor: "pointer" }}
        onClick={() => {
          log.info("reload clicked");
          window.location.reload();
        }}>
        Click to upgrade
      </Text>
    </Notification>
  );
};
