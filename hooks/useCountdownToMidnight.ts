import { useEffect, useState } from 'react';
import { getSecondsToNextUtcMidnight } from '../lib/daily';

export function useCountdownToMidnight() {
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsToNextUtcMidnight());

  useEffect(() => {
    const update = () => setSecondsLeft(getSecondsToNextUtcMidnight());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return secondsLeft;
}
