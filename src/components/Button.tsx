import {
  ActionIcon,
  Button,
  type ActionIconProps,
  type ButtonProps,
} from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import { forwardRef } from "react";

const fullWidthStyles = {
  inner: { width: "100%" },
  label: { width: "100%", justifyContent: "center" as const },
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const LinkButtonComponent = forwardRef<
  HTMLAnchorElement,
  ButtonProps & AnchorProps
>((props, ref) => (
  <Button {...props} component="a" ref={ref} styles={fullWidthStyles} />
));

export const LinkButton = createLink(LinkButtonComponent);

const LinkActionIconComponent = forwardRef<
  HTMLAnchorElement,
  ActionIconProps & AnchorProps
>((props, ref) => <ActionIcon {...props} component="a" ref={ref} />);

export const LinkActionIcon = createLink(LinkActionIconComponent);

export const ExternalLinkButton = ({
  href,
  ...props
}: ButtonProps & { href: string }) => {
  return (
    <Button
      {...props}
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    />
  );
};
