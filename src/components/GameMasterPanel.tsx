import { BoltIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import type { Team } from "../types/game";
import { gameUpgrades } from "../utils/gameData";
import { formatMoney } from "../utils/format";
import { playKaching } from "../utils/sound";
import { purchaseGameUpgrade } from "../services/teamService";
import { Button } from "./ui/Button";

export function GameMasterPanel({
  teams,
  onChanged,
}: {
  teams: Team[];
  onChanged: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? 1);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  async function buy(upgradeKey: string) {
    if (!selectedTeam) return;
    setBusy(upgradeKey);
    setMessage(null);

    try {
      await purchaseGameUpgrade(selectedTeam.id, upgradeKey);
      playKaching();
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Aankoop is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            Game Master
          </p>
          <h2 className="text-2xl font-black text-white">Vooraf ingestelde upgrades</h2>
        </div>
        <select
          value={selectedTeamId}
          onChange={(event) => setSelectedTeamId(Number(event.target.value))}
          className="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} · {formatMoney(team.total_money)}
            </option>
          ))}
        </select>
      </div>

      {message ? (
        <p className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {gameUpgrades.map((upgrade) => {
          const canAfford = selectedTeam
            ? selectedTeam.total_money >= upgrade.cost
            : false;

          return (
            <article
              key={upgrade.key}
              className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <BoltIcon className="h-6 w-6 text-yellow-200" />
                <span className="number-tabular rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                  +{formatMoney(upgrade.incomeBoost)}/min
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{upgrade.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                {upgrade.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-300">
                Kost {formatMoney(upgrade.cost)}
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                variant={canAfford ? "primary" : "secondary"}
                disabled={!canAfford || Boolean(busy)}
                onClick={() => buy(upgrade.key)}
              >
                {busy === upgrade.key ? "Kopen..." : "Koop"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
