import {useEffect, useState} from 'react';

export function useAnimatedPresence(isOpen: boolean, exitDurationMs = 160) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsExiting(false);
      return;
    }

    if (!shouldRender) return;

    setIsExiting(true);
    const timer = window.setTimeout(() => {
      setShouldRender(false);
      setIsExiting(false);
    }, exitDurationMs);

    return () => window.clearTimeout(timer);
  }, [isOpen, exitDurationMs, shouldRender]);

  return {
    shouldRender,
    state: isExiting ? 'closing' : 'open',
  } as const;
}
