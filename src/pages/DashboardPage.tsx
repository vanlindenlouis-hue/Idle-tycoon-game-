import { Cog6ToothIcon, SignalIcon } from "@heroicons/react/24/outline";
import { TeamCard } from "../components/TeamCard";
import { DetailedCharts } from "../components/DetailedCharts";
import { Leaderboard } from "../components/Leaderboard";
import { EmptyState } from "../components/ui/EmptyState";
import { useGameClock } from "../hooks/useGameClock";
import { useTeams } from "../hooks/useTeams";
import { useTransactions } from "../hooks/useTransactions";

export function DashboardPage() {
  const { rankedTeams, loading, error, isDemoMode } = useTeams();
  const { transactionsByTeam } = useTransactions();
  const clock = useGameClock(!isDemoMode);

  return (
    <main className="min-h-screen px-4 py-5 text-white md:px-7 md:py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200">
            Chiro Supermarket Tycoon
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-5xl">
            Live Scoreboard
          </h1>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
            clock.paused
              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
              : "border-teal-300/25 bg-teal-300/10 text-teal-100"
          }`}
        >
          <SignalIcon className="h-5 w-5" />
          <span>
            {isDemoMode
              ? "Demo met seedteams"
              : clock.paused
                ? "Klok gepauzeerd"
                : "Realtime actief"}
          </span>
        </div>
      </header>

      {isDemoMode ? (
        <div className="mb-5">
          <EmptyState
            title="Supabase is nog niet gekoppeld"
            body="Vul de waarden uit .env.example in om live data, auth en realtime updates te gebruiken. De vier startteams blijven zichtbaar zodat de projectie meteen gecontroleerd kan worden."
          />
        </div>
      ) : null}

      {error ? (
        <div className="mb-5">
          <EmptyState title="Realtime data kon niet laden" body={error} />
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="grid gap-5 md:grid-cols-2">
          {rankedTeams.map((team, index) => (
            <TeamCard
              key={team.id}
              team={team}
              rank={index}
              transactions={transactionsByTeam[team.id] ?? []}
            />
          ))}
        </div>
        <div className="grid content-start gap-5">
          <Leaderboard teams={rankedTeams} />
          <a
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/12 hover:text-white"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Admin</span>
          </a>
        </div>
      </section>

      {loading ? (
        <div className="fixed inset-x-0 bottom-0 h-1 overflow-hidden bg-slate-900">
          <div className="h-full w-1/2 animate-shine bg-teal-300" />
        </div>
      ) : null}

      <DetailedCharts
        teams={rankedTeams}
        transactionsByTeam={transactionsByTeam}
      />
    </main>
  );
}
