import { useEffect, useState } from 'react';
import { getSecondsToNextUtcMidnight, getUtcDateKey } from '../lib/daily';

export function useUtcDateKey() {
  const [dateKey, setDateKey] = useState(() => getUtcDateKey());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNextRollover = () => {
      setDateKey(getUtcDateKey());
      timeout = setTimeout(
        scheduleNextRollover,
        (getSecondsToNextUtcMidnight() + 1) * 1000,
      );
    };

    scheduleNextRollover();
    return () => clearTimeout(timeout);
  }, []);

  return dateKey;
}
