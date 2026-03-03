import { createContext, useContext } from "react";

type NavContextValue = {
  navOpened: boolean;
  openNav: () => void;
  closeNav: () => void;
};

const NavContext = createContext<NavContextValue>({
  navOpened: false,
  openNav: () => {},
  closeNav: () => {},
});

export const NavProvider = NavContext.Provider;
export const useNav = () => useContext(NavContext);
