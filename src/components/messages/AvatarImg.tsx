import { Avatar } from "@mantine/core";
import { useAvatar } from "@/hooks/useAvatar";
import { useConvo } from "@/hooks/useConvo";

export type AvatarImgProps = {
  inboxId: string;
};

export const AvatarImg: React.FC<AvatarImgProps> = ({ inboxId }) => {
  const { convo, memberProfiles } = useConvo();
  const src = useAvatar(convo.id, inboxId);
  const name = memberProfiles.get(inboxId)?.name;
  return (
    <Avatar size={28} radius="xl" src={src}>
      {!src && (name ? name[0].toUpperCase() : "S")}
    </Avatar>
  );
};
