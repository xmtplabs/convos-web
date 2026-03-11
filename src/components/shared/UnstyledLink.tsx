import { Anchor, type AnchorProps } from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import { forwardRef } from "react";
import classes from "./UnstyledLink.module.css";

type Props = AnchorProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const UnstyledLinkComponent = forwardRef<HTMLAnchorElement, Props>(
  (props, ref) => (
    <Anchor {...props} component="a" ref={ref} className={classes.link} />
  ),
);

export const UnstyledLink = createLink(UnstyledLinkComponent);
