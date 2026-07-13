import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import type { Team } from "../types/game";
import { initialTeams } from "../utils/gameData";
import { fetchTeams, refreshAllIncome } from "../services/teamService";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async (applyIncome = false) => {
    if (!isSupabaseConfigured) {
      setTeams(initialTeams);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const nextTeams = await fetchTeams({ applyIncome });
      setTeams(nextTeams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teams laden is mislukt.");
    } finally {
      setLoading(false);
    }
  }, []);

  const rankedTeams = useMemo(
    () => [...teams].sort((a, b) => b.total_money - a.total_money),
    [teams],
  );

  useEffect(() => {
    void loadTeams(true);

    if (!isSupabaseConfigured || !supabase) return;

    const client = supabase;

    const interval = window.setInterval(() => {
      void refreshAllIncome().catch(() => undefined);
    }, 30_000);

    const channel = client
      .channel("teams-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => void loadTeams(false),
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void client.removeChannel(channel);
    };
  }, [loadTeams]);

  return {
    teams,
    rankedTeams,
    loading,
    error,
    reload: () => loadTeams(true),
    isDemoMode: !isSupabaseConfigured,
  };
}
