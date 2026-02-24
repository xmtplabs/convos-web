import { Notification, Text } from "@mantine/core";
import { RefreshCwIcon } from "lucide-react";
import classes from "./UpdateNotification.module.css";

export type UpdateNotificationProps = {
  onClose: () => void;
};

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onClose,
}) => (
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
        window.location.reload();
      }}>
      Click to upgrade
    </Text>
  </Notification>
);
