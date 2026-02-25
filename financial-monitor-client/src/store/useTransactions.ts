import { useState, useCallback } from "react";
import type { Transaction } from "../types";

const MAX_ITEMS = 1000;

/**
 * Simple hook for managing transactions state with useState.
 * State lives in App (always mounted), so it survives route changes.
 */
export default function useTransactions() {
  const [list, setList] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  /** Add a single transaction (from SignalR). Avoids duplicates. */
  const addTransaction = useCallback((t: Transaction) => {
    setList((prev) => {
      if (prev.some((x) => x.transactionId === t.transactionId)) return prev;
      return [t, ...prev].slice(0, MAX_ITEMS);
    });
  }, []);

  /** Load a batch from GET /api/transactions. Server returns oldest-first, we reverse. */
  const loadTransactions = useCallback((items: Transaction[]) => {
    setList((prev) => {
      const existingIds = new Set(prev.map((x) => x.transactionId));
      const newItems = items.filter((t) => !existingIds.has(t.transactionId));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems.reverse()].slice(0, MAX_ITEMS);
    });
  }, []);

  const clear = useCallback(() => setList([]), []);

  const visible = filter
    ? list.filter((t) => t.status === filter)
    : list;

  return {
    list: visible,
    rawList: list,
    addTransaction,
    loadTransactions,
    clear,
    setFilter,
    filter,
  };
}