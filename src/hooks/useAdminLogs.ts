import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import { fetchAdminLogs } from "../services/teamService";
import type { AdminLog } from "../types/game";

export function useAdminLogs(enabled = true) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured && enabled);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured) {
      setLogs([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLogs(await fetchAdminLogs());
    } catch (err) {
      setLogs([]);
      setError(
        err instanceof Error
          ? err.message
          : "Adminlogs laden is mislukt.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadLogs();

    if (!enabled || !isSupabaseConfigured || !supabase) return;

    const client = supabase;

    const channel = client
      .channel("admin-logs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_logs" },
        () => void loadLogs(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled, loadLogs]);

  return { logs, loading, error, reload: loadLogs };
}
