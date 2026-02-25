import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "@/components/app/Welcome";

export const Route = createFileRoute("/_app/")({ component: Welcome });
