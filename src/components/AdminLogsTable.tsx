import { ClockIcon } from "@heroicons/react/24/outline";
import type { AdminLog } from "../types/game";
import { formatTime } from "../utils/format";

function summarize(value: Record<string, unknown> | null): string {
  if (!value) return "-";

  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join(", ");
}

export function AdminLogsTable({
  logs,
  loading,
}: {
  logs: AdminLog[];
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex items-center gap-2">
        <ClockIcon className="h-6 w-6 text-teal-200" />
        <h2 className="text-xl font-black text-white">Upgrade geschiedenis</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Tijd</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Actie</th>
              <th className="px-3 py-2">Oude waarde</th>
              <th className="px-3 py-2">Nieuwe waarde</th>
              <th className="px-3 py-2">Admin</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="bg-slate-950/55">
                <td className="rounded-l-lg px-3 py-3 text-slate-300">
                  {formatTime(log.created_at)}
                </td>
                <td className="px-3 py-3 font-semibold text-white">
                  {log.team_name ?? "Alle teams"}
                </td>
                <td className="px-3 py-3 text-teal-100">{log.action}</td>
                <td className="max-w-[15rem] px-3 py-3 text-slate-400">
                  {summarize(log.old_value)}
                </td>
                <td className="max-w-[15rem] px-3 py-3 text-slate-300">
                  {summarize(log.new_value)}
                </td>
                <td className="rounded-r-lg px-3 py-3 text-slate-400">
                  {log.created_by_email ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && logs.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          Nog geen adminacties gelogd.
        </p>
      ) : null}
    </section>
  );
}
