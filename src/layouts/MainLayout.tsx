import { createLogger } from "@/utils/log";
import classes from "./MainLayout.module.css";

const log = createLogger("layout");

type MainLayoutProps = React.PropsWithChildren & {
  aside?: React.ReactNode;
  opened?: boolean;
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  aside,
  opened = false,
}) => {
  log.trace("render", { opened });
  return (
    <div className={classes.root} data-state={opened ? "opened" : "closed"}>
      <aside className={classes.aside}>
        <nav className={classes.asideNav}>{aside}</nav>
      </aside>
      <main className={classes.main}>
        <div className={classes.mainContent}>{children}</div>
      </main>
    </div>
  );
};
