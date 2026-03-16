import { useNav } from "@/contexts/NavContext";
import { createLogger } from "@/utils/log";
import classes from "./MainLayout.module.css";

const log = createLogger("layout");

type MainLayoutProps = React.PropsWithChildren & {
  aside?: React.ReactNode;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, aside }) => {
  const { navOpened } = useNav();
  log.trace("render", { opened: navOpened });
  return (
    <div className={classes.root} data-state={navOpened ? "opened" : "closed"}>
      {aside && (
        <aside className={classes.aside}>
          <nav className={classes.asideNav}>{aside}</nav>
        </aside>
      )}
      <main className={aside ? classes.main : classes.mainFull}>
        <div className={classes.mainContent}>{children}</div>
      </main>
    </div>
  );
};
