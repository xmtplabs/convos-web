import mantineCss from "@mantine/core/styles.css?url";
import { createRootRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/app/NotFound";
import { Root } from "@/components/app/Root";
import themeCss from "@/theme.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Convos Web",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/convos.svg",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo192.png",
      },
      {
        rel: "stylesheet",
        href: mantineCss,
      },
      {
        rel: "stylesheet",
        href: themeCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: Root,
});
