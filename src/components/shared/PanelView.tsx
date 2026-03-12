import classes from "./PanelView.module.css";

export const PanelView: React.FC<
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
