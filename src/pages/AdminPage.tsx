import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CircleStackIcon,
  ListBulletIcon,
  PowerIcon,
  SignalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useState } from "react";
import { AdminLogsTable } from "../components/AdminLogsTable";
import { AdminTeamPanel } from "../components/AdminTeamPanel";
import { ConfirmModal } from "../components/ConfirmModal";
import { GameMasterPanel } from "../components/GameMasterPanel";
import { LoginPanel } from "../components/LoginPanel";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAdminLogs } from "../hooks/useAdminLogs";
import { useAuth } from "../hooks/useAuth";
import { useTeams } from "../hooks/useTeams";
import { isSupabaseConfigured } from "../supabase/client";
import { resetActivity } from "../services/teamService";
import { formatMoney } from "../utils/format";

type AdminTab = "teams" | "game-master" | "logs";

const tabs: Array<{
  id: AdminTab;
  label: string;
  icon: ReactNode;
}> = [
  { id: "teams", label: "Teams", icon: <Squares2X2Icon /> },
  { id: "game-master", label: "Game Master", icon: <ChartBarIcon /> },
  { id: "logs", label: "Logs", icon: <ListBulletIcon /> },
];

export function AdminPage({ initialTab = "teams" }: { initialTab?: AdminTab }) {
  const auth = useAuth();
  const {
    teams,
    reload,
    loading: teamsLoading,
    error: teamsError,
    isDemoMode,
  } = useTeams();
  const {
    logs,
    loading: logsLoading,
    error: logsError,
    reload: reloadLogs,
  } = useAdminLogs(auth.isAuthenticated);
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMoney = teams.reduce((sum, team) => sum + team.total_money, 0);
  const totalIncome = teams.reduce(
    (sum, team) => sum + team.income_per_minute,
    0,
  );

  async function refreshAdminData() {
    await reload();
    await reloadLogs();
  }

  if (!isSupabaseConfigured || isDemoMode) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <EmptyState
            title="Admin heeft Supabase nodig"
            body="Configureer VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY, voer de SQL-scripts uit en maak een admingebruiker aan in Supabase Auth."
          />
          <a
            href="/"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-semibold text-slate-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Terug naar scoreboard
          </a>
        </div>
      </main>
    );
  }

  if (auth.loading) {
    return <main className="min-h-screen bg-slate-950" />;
  }

  if (!auth.isAuthenticated) {
    return <LoginPanel onLogin={auth.signIn} />;
  }

  async function handleResetAll() {
    setBusy(true);
    setError(null);

    try {
      await resetActivity();
      await refreshAdminData();
      setConfirmResetAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset is mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-white md:px-7">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            Supermarket Tycoon
          </p>
          <h1 className="text-3xl font-black">Admin dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/15"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Scoreboard
          </a>
          <Button
            type="button"
            variant="secondary"
            icon={<SignalIcon />}
            onClick={() => void refreshAdminData()}
            disabled={teamsLoading}
          >
            Sync inkomen
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={<ArrowPathIcon />}
            onClick={() => setConfirmResetAll(true)}
            disabled={busy}
          >
            Reset alles
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon={<PowerIcon />}
            onClick={() => void auth.signOut()}
          >
            Afmelden
          </Button>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <nav className="mb-5 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-slate-950/35 p-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-teal-300 text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="h-5 w-5">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
            <CircleStackIcon className="h-5 w-5 text-teal-200" />
            <span>Database</span>
          </div>
          <p className="text-2xl font-black text-white">
            {teams.length}/4 teams
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {teamsError ? "Controle nodig" : "Verbonden met Supabase"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <p className="mb-2 text-sm font-semibold text-slate-400">
            Totaal geld
          </p>
          <p className="number-tabular text-2xl font-black text-white">
            {formatMoney(totalMoney)}
          </p>
          <p className="mt-1 text-sm text-slate-400">Over alle teams</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <p className="mb-2 text-sm font-semibold text-slate-400">
            Totaal inkomen
          </p>
          <p className="number-tabular text-2xl font-black text-white">
            {formatMoney(totalIncome)}/min
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Berekend via last_income_update
          </p>
        </div>
      </section>

      {teamsError ? (
        <div className="mb-5">
          <EmptyState
            title="Supabase database is niet volledig klaar"
            body={`${teamsError} Controleer of 001_schema.sql en 002_seed.sql in Supabase SQL Editor uitgevoerd zijn en of realtime op teams, transactions en admin_logs staat.`}
          />
        </div>
      ) : null}

      {tab === "teams" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {teams.map((team) => (
            <AdminTeamPanel
              key={team.id}
              team={team}
              onChanged={refreshAdminData}
            />
          ))}
        </section>
      ) : null}

      {tab === "game-master" ? (
        <GameMasterPanel teams={teams} onChanged={refreshAdminData} />
      ) : null}

      {tab === "logs" ? (
        <AdminLogsTable logs={logs} loading={logsLoading} error={logsError} />
      ) : null}

      {confirmResetAll ? (
        <ConfirmModal
          title="Volledige activiteit resetten?"
          body="Alle teams gaan terug naar EUR 0, 0 upgrades en EUR 100 per minuut. Deze actie wordt gelogd."
          confirmLabel="Reset alles"
          busy={busy}
          onCancel={() => setConfirmResetAll(false)}
          onConfirm={() => void handleResetAll()}
        />
      ) : null}
    </main>
  );
}
