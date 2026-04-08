// Import Dependencies
import { useMemo, useState } from "react";
import { useLocation } from "react-router";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { navigation } from "app/navigation";
import {
  generateDashboardsConfig,
  getStoredPermissions,
} from "app/navigation/dashboards";
import { useLabsContext } from "app/contexts/labs/context";
import { useDidUpdate } from "hooks";
import { isRouteActive } from "utils/isRouteActive";
import { MainPanel } from "./MainPanel";
import { PrimePanel } from "./PrimePanel";

// ----------------------------------------------------------------------

export function Sidebar() {
  const { pathname } = useLocation();
  const { name, lgAndDown } = useBreakpointsContext();
  const { isExpanded, close } = useSidebarContext();
  const { labs } = useLabsContext();

  const dynamicNavigation = useMemo(() => {
    const permissions = getStoredPermissions();
    const dashboardsIndex = navigation.findIndex(
      (item) => item.id === "dashboards",
    );

    if (dashboardsIndex === -1) return navigation;

    const updatedDashboards = generateDashboardsConfig(labs, permissions);
    const newNavigation = [...navigation];
    newNavigation[dashboardsIndex] = updatedDashboards;

    return newNavigation;
  }, [labs]);

  const initialSegment = useMemo(
    () => dynamicNavigation.find((item) => isRouteActive(item.path, pathname)),
    [dynamicNavigation, pathname],
  );

  const [activeSegmentPath, setActiveSegmentPath] = useState(
    initialSegment?.path,
  );

  const currentSegment = useMemo(() => {
    return dynamicNavigation.find((item) => item.path === activeSegmentPath);
  }, [activeSegmentPath, dynamicNavigation]);

  useDidUpdate(() => {
    const activePath = dynamicNavigation.find((item) =>
      isRouteActive(item.path, pathname),
    )?.path;

    if (!isRouteActive(activeSegmentPath, pathname)) {
      setActiveSegmentPath(activePath);
    }
  }, [activeSegmentPath, dynamicNavigation, pathname]);

  useDidUpdate(() => {
    if (lgAndDown && isExpanded) close();
  }, [name]);

  return (
    <>
      <MainPanel
        nav={dynamicNavigation}
        activeSegment={activeSegmentPath}
        setActiveSegment={setActiveSegmentPath}
      />
      <PrimePanel
        close={close}
        currentSegment={currentSegment}
        pathname={pathname}
      />
    </>
  );
}