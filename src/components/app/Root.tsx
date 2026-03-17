import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { HeadContent, Scripts } from "@tanstack/react-router";
import { AppLockProvider } from "@/contexts/AppLockContext";
import { NavProvider } from "@/contexts/NavContext";
import { XmtpLockProvider } from "@/contexts/XmtpLockContext";
import { createLogger } from "@/utils/log";
import { theme } from "@/utils/theme";

const log = createLogger("root");

export const Root = ({ children }: { children: React.ReactNode }) => {
  log.debug("render");
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" limit={5} />
          <NavProvider>
            <AppLockProvider>
              <XmtpLockProvider>{children}</XmtpLockProvider>
            </AppLockProvider>
          </NavProvider>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  );
};
