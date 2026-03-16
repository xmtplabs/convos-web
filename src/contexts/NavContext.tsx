import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMobile } from "@/hooks/useMobile";

type NavContextValue = {
  navOpened: boolean;
  openNav: () => void;
  closeNav: () => void;
  setHasConvos: (has: boolean) => void;
};

const NavContext = createContext<NavContextValue>({
  navOpened: false,
  openNav: () => {},
  closeNav: () => {},
  setHasConvos: () => {},
});

export const NavProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const isMobile = useIsMobile();
  const [navOpened, setNavOpened] = useState(false);
  const openNav = useCallback(() => {
    setNavOpened(true);
  }, []);
  const closeNav = useCallback(() => {
    setNavOpened(false);
  }, []);
  const initialized = useRef(false);

  const setHasConvos = useCallback(
    (has: boolean) => {
      if (!has) {
        setNavOpened(false);
        initialized.current = false;
      } else if (!initialized.current) {
        setNavOpened(!isMobile);
        initialized.current = true;
      }
    },
    [isMobile],
  );

  const value = useMemo(
    () => ({ navOpened, openNav, closeNav, setHasConvos }),
    [navOpened, openNav, closeNav, setHasConvos],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
};

export const useNav = () => useContext(NavContext);
