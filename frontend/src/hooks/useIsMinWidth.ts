import { useEffect, useState } from "react";

function getMatches(minWidth: number) {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
}

export function useIsMinWidth(minWidth: number) {
  const [matches, setMatches] = useState(() => getMatches(minWidth));

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [minWidth]);

  return matches;
}

