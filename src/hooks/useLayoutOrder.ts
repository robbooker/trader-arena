import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'trader-arena-layout-';

export function useLayoutOrder(zoneId: string, defaultOrder: string[]): [string[], (order: string[]) => void] {
  const [order, setOrderState] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + zoneId);
      if (!raw) return defaultOrder;
      const saved: string[] = JSON.parse(raw);
      // Validate: must contain exactly the same IDs as defaultOrder
      const defaultSet = new Set(defaultOrder);
      const savedSet = new Set(saved);
      if (saved.length !== defaultOrder.length || !saved.every((id) => defaultSet.has(id)) || !defaultOrder.every((id) => savedSet.has(id))) {
        return defaultOrder;
      }
      return saved;
    } catch {
      return defaultOrder;
    }
  });

  const setOrder = useCallback((newOrder: string[]) => {
    setOrderState(newOrder);
    try {
      localStorage.setItem(STORAGE_PREFIX + zoneId, JSON.stringify(newOrder));
    } catch {
      // storage full — ignore
    }
  }, [zoneId]);

  return [order, setOrder];
}
