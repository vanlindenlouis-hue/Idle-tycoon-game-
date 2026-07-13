import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "../supabase/client";
import { fetchClockPaused, updateClockPaused } from "../services/teamService";

export function useGameClock(enabled = true) {
  const [paused, setPausedState] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured && enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured) {
      setPausedState(false);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      setPausedState(await fetchClockPaused());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Klokstatus laden is mislukt.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();

    if (!enabled || !isSupabaseConfigured) return;

    const interval = window.setInterval(() => {
      void reload();
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [enabled, reload]);

  async function setPaused(nextPaused: boolean) {
    setLoading(true);
    setError(null);

    try {
      const next = await updateClockPaused(nextPaused);
      setPausedState(next);
      return next;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Klok aanpassen is mislukt.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  return { paused, loading, error, reload, setPaused };
}
