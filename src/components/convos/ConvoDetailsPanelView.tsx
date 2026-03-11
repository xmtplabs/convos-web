import classes from "./ConvoDetailsPanelView.module.css";

export const ConvoDetailsPanelView: React.FC<
  React.PropsWithChildren<{
    name: string;
    active: boolean;
    offscreen?: "left" | "right";
  }>
> = ({ name, active, offscreen = "right", children }) => (
  <div
    className={classes.view}
    data-page={name}
    {...(active ? {} : { "data-offscreen": offscreen })}>
    {children}
  </div>
);
