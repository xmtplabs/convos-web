import { createTheme, Modal } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "dark",
  fontSizes: {
    xxs: "calc(0.6875rem * var(--mantine-scale))",
    xxl: "calc(2rem * var(--mantine-scale))",
  },
  lineHeights: {
    xxs: "1.2",
    xxl: "1.25",
  },
  spacing: {
    xxs: "calc(0.5rem * var(--mantine-scale))",
    xxxs: "calc(0.25rem * var(--mantine-scale))",
    lg: "calc(1.5rem * var(--mantine-scale))",
  },
  components: {
    Modal: Modal.extend({
      styles: {
        content: {
          backgroundColor: "var(--mantine-color-body)",
        },
      },
    }),
  },
});
