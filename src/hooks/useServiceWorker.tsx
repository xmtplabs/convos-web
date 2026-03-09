import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { createLogger } from "@/utils/log";

const log = createLogger("service-worker");

const UPDATE_POLL_INTERVAL = 60 * 1000;

export function useServiceWorker() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      log.debug("not supported");
      return;
    }

    // if a controller already exists, this isn't a fresh install.
    // any future controllerchange means a new SW version took over.
    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (hadController) {
        log.info("update available (new service worker)");
        notifications.show({
          color: "green",
          title: "A new version is available",
          withBorder: true,
          autoClose: false,
          message: (
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
          ),
        });
      }
    };

    // handle navigation requests from service worker (notification clicks)
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: string } | null;
      if (data?.type === "navigate" && data.url) {
        log.info("navigating from notification", { url: data.url });
        void navigate({ to: data.url });
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    navigator.serviceWorker.addEventListener("message", onMessage);

    navigator.serviceWorker
      .register(`/sw.js?v=${__SW_VERSION__}`)
      .then((registration) => {
        log.info("registered");
        // poll for updates so updates are discovered without navigation
        intervalRef.current = setInterval(() => {
          registration.update().catch(() => {});
        }, UPDATE_POLL_INTERVAL);
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      navigator.serviceWorker.removeEventListener("message", onMessage);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigate]);
}
