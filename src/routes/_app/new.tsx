import { Avatar, Group, Stack, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { useEffect } from "react";
import { useCreateConvo } from "@/hooks/useCreateConvo";
import { ConvoLayout } from "@/layouts/ConvoLayout";

const NewConvo = () => {
  const createConvo = useCreateConvo();

  useEffect(() => {
    void createConvo();
  }, [createConvo]);

  return (
    <ConvoLayout
      header={
        <Group gap="sm" wrap="nowrap">
          <Avatar radius="xl" size="48">
            <ImageIcon size={24} />
          </Avatar>
          <Stack gap="0">
            <Text fw={500} size="md">
              New Convo
            </Text>
          </Stack>
        </Group>
      }
      footer={null}
    />
  );
};

export const Route = createFileRoute("/_app/new")({
  component: NewConvo,
  ssr: false,
});
