// Import Dependencies
import { useLocation } from "react-router";
import { useRef, useState, useMemo } from "react"; // Add useMemo
import {
  useDidUpdate,
  useIsomorphicEffect,
} from "hooks";
import SimpleBar from "simplebar-react";

// Local Imports
import { navigation } from "app/navigation";
import {
  generateDashboardsConfig,
  getStoredPermissions,
} from "app/navigation/dashboards";
import { useLabsContext } from "app/contexts/labs/context"; // Add this
import { Group } from "./Group";
import { Accordion } from "components/ui";
import { isRouteActive } from "utils/isRouteActive";

// ----------------------------------------------------------------------

export function Menu() {
  const { pathname } = useLocation();
  const { ref } = useRef();

  // ✅ Fetch labs data from context
  const { labs, loading } = useLabsContext();

  // ✅ Generate dynamic navigation config
  const dynamicNavigation = useMemo(() => {
    const permissions = getStoredPermissions();
    // Find the dashboards item in navigation array
    const dashboardsIndex = navigation.findIndex(item => item.id === 'dashboards');

    if (dashboardsIndex === -1) return navigation;

    // Generate dynamic dashboards config with labs data
    const updatedDashboards = generateDashboardsConfig(labs, permissions);

    // Replace the static dashboards with dynamic one
    const newNavigation = [...navigation];
    newNavigation[dashboardsIndex] = updatedDashboards;

    return newNavigation;
  }, [labs]);

  const activeGroup = dynamicNavigation.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const activeCollapsible = activeGroup?.childs?.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const [expanded, setExpanded] = useState(activeCollapsible?.path || null);

  useDidUpdate(() => {
    activeCollapsible?.path !== expanded &&
      setExpanded(activeCollapsible?.path);
  }, [activeCollapsible?.path]);

  useIsomorphicEffect(() => {
    const activeItem = ref?.current?.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Loading labs...</div>
      </div>
    );
  }

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pb-6"
    >
      <Accordion value={expanded} onChange={setExpanded} className="space-y-1">
        {dynamicNavigation.map((nav) => (
          <Group key={nav.id} data={nav} />
        ))}
      </Accordion>
    </SimpleBar>
  );
}