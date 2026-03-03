import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
// import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Scripts } from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { theme } from "@/utils/theme";

const GLOBAL_ERROR_SCRIPT = `
window.onerror = function(msg, src, line, col, err) {
  console.error('[global] uncaught error:', msg, 'at', src + ':' + line + ':' + col, err);
};
window.onunhandledrejection = function(e) {
  console.error('[global] unhandled rejection:', e.reason);
};
console.debug('[ui] global error handlers installed');
`;

export const Root = ({ children }: { children: React.ReactNode }) => {
  console.debug("[ui] Root shell render");
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: GLOBAL_ERROR_SCRIPT }} />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" limit={5} />
          {children}
        </MantineProvider>
        {/* <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        /> */}
        <Scripts />
      </body>
    </html>
  );
};
