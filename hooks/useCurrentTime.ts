// 현재 시간 훅 — 1분마다 "HH:mm" 형식 현재 시간 갱신
import { useState, useEffect } from 'react';
import { formatTime, parseTime } from '@/utils/time';

function getCurrentTimeString(): string {
  const now = new Date();
  return formatTime(now.getHours() * 60 + now.getMinutes());
}

/**
 * 현재 시간을 "HH:mm" 형식으로 반환하는 훅
 * intervalMs마다 갱신 (기본 1분)
 */
export function useCurrentTime(intervalMs: number = 60000): string {
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return currentTime;
}
