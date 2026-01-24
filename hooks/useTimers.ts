import { useState, useEffect } from 'react';

// Returns remaining time in milliseconds
export const useCountdown = (endTime: number) => {
  const calculateRemaining = () => Math.max(0, endTime - Date.now());
  const [remainingMs, setRemainingMs] = useState(calculateRemaining);

  useEffect(() => {
    if (endTime <= Date.now()) {
      setRemainingMs(0);
      return;
    }
    const timer = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemainingMs(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [endTime]);

  return remainingMs;
};

// Formats a duration given in SECONDS into a string (d:h:m:s or h:m:s)
export const formatDuration = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00:00";
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    let str = '';
    if (d > 0) str += `${d}T `;
    str += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return str;
};