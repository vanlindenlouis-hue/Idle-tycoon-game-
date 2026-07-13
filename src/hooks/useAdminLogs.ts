import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import { fetchAdminLogs } from "../services/teamService";
import type { AdminLog } from "../types/game";

export function useAdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadLogs = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLogs(await fetchAdminLogs());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();

    if (!isSupabaseConfigured || !supabase) return;

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
  }, [loadLogs]);

  return { logs, loading, reload: loadLogs };
}
