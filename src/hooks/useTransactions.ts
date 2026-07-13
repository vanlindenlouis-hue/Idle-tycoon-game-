import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import { fetchTransactions } from "../services/teamService";
import type { Transaction } from "../types/game";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTransactions([]);
      return;
    }

    try {
      setTransactions(await fetchTransactions());
    } catch {
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();

    if (!isSupabaseConfigured || !supabase) return;

    const client = supabase;

    const channel = client
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => void loadTransactions(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loadTransactions]);

  const transactionsByTeam = useMemo(() => {
    return transactions.reduce<Record<number, Transaction[]>>(
      (groups, transaction) => {
        groups[transaction.team_id] = groups[transaction.team_id] ?? [];
        groups[transaction.team_id].push(transaction);
        return groups;
      },
      {},
    );
  }, [transactions]);

  return { transactions, transactionsByTeam, reload: loadTransactions };
}
