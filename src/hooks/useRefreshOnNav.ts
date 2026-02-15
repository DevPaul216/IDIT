import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Custom hook that triggers a refresh callback when the page/route changes
 * Ensures data is always fresh when navigating between tabs
 * 
 * Usage:
 * const [data, setData] = useState([]);
 * const refresh = useCallback(() => { fetchData(); }, []);
 * useRefreshOnNav(refresh);
 */
export function useRefreshOnNav(onRefresh: () => void) {
  const pathname = usePathname();

  useEffect(() => {
    onRefresh();
  }, [pathname, onRefresh]);
}

/**
 * Alternative: Hook to refetch when page becomes visible (focus)
 * More performant as it only refetches when tab is actually focused
 */
export function useRefreshOnFocus(onRefresh: () => void) {
  useEffect(() => {
    // Initial fetch
    onRefresh();

    // Refetch when page comes back to focus
    const handleFocus = () => onRefresh();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [onRefresh]);
}

/**
 * Hook to refetch when both route changes AND page comes to focus
 * Combines both strategies for best UX
 */
export function useRefreshOnNavAndFocus(onRefresh: () => void) {
  const pathname = usePathname();

  useEffect(() => {
    onRefresh();
  }, [pathname, onRefresh]);

  useEffect(() => {
    const handleFocus = () => onRefresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [onRefresh]);
}
