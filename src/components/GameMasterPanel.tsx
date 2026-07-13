import { BoltIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { GameUpgrade, Team } from "../types/game";
import { applyFilledUpgrade } from "../services/teamService";
import { gameUpgrades } from "../utils/gameData";
import { formatMoney } from "../utils/format";
import { playKaching } from "../utils/sound";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";

const storageKey = "supermarket-tycoon-upgrade-presets";

function numericInput(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function makeUpgradeKey() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUpgrade(value: Partial<GameUpgrade>, fallback: GameUpgrade) {
  return {
    key: String(value.key ?? fallback.key),
    name: String(value.name ?? fallback.name).slice(0, 48),
    cost: numericInput(String(value.cost ?? fallback.cost)),
    incomeBoost: numericInput(String(value.incomeBoost ?? fallback.incomeBoost)),
    description: String(value.description ?? fallback.description).slice(0, 90),
  };
}

function loadPresetUpgrades() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return gameUpgrades;

    const parsed = JSON.parse(stored) as Array<Partial<GameUpgrade>>;
    if (!Array.isArray(parsed)) return gameUpgrades;

    const defaultUpgrades = gameUpgrades.map((fallback) => {
      const saved = parsed.find((upgrade) => upgrade.key === fallback.key);
      return normalizeUpgrade(saved ?? {}, fallback);
    });
    const customUpgrades = parsed
      .filter(
        (upgrade) =>
          typeof upgrade.key === "string" &&
          !gameUpgrades.some((fallback) => fallback.key === upgrade.key),
      )
      .map((upgrade) =>
        normalizeUpgrade(upgrade, {
          key: String(upgrade.key),
          name: "Nieuwe upgrade",
          cost: 1000,
          incomeBoost: 100,
          description: "Eigen upgrade",
        }),
      );

    return [...defaultUpgrades, ...customUpgrades];
  } catch {
    return gameUpgrades;
  }
}

type EditableUpgradeField = keyof Pick<
  GameUpgrade,
  "name" | "cost" | "incomeBoost" | "description"
>;

export function GameMasterPanel({
  teams,
  onChanged,
}: {
  teams: Team[];
  onChanged: () => void | Promise<void>;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? 1);
  const [presetUpgrades, setPresetUpgrades] = useState<GameUpgrade[]>(
    loadPresetUpgrades,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  useEffect(() => {
    if (teams.length > 0 && !teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [selectedTeamId, teams]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(presetUpgrades));
  }, [presetUpgrades]);

  function updatePreset(key: string, field: EditableUpgradeField, value: string) {
    setPresetUpgrades((current) =>
      current.map((upgrade) =>
        upgrade.key === key
          ? {
              ...upgrade,
              [field]:
                field === "cost" || field === "incomeBoost"
                  ? numericInput(value)
                  : value,
            }
          : upgrade,
      ),
    );
  }

  function addPreset() {
    setPresetUpgrades((current) => [
      ...current,
      {
        key: makeUpgradeKey(),
        name: `Nieuwe upgrade ${current.length + 1}`,
        cost: 1000,
        incomeBoost: 100,
        description: "Eigen upgrade voor het spel.",
      },
    ]);
  }

  function removePreset(key: string) {
    setPresetUpgrades((current) =>
      current.filter((upgrade) => upgrade.key !== key),
    );
  }

  async function buy(upgrade: GameUpgrade) {
    if (!selectedTeam) return;
    setBusy(upgrade.key);
    setMessage(null);

    try {
      await applyFilledUpgrade(
        selectedTeam.id,
        upgrade.name,
        upgrade.cost,
        upgrade.incomeBoost,
      );
      playKaching();
      await onChanged();
      setMessage("Upgrade gekocht en realtime verwerkt.");
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
          <h2 className="text-2xl font-black text-white">
            Vooraf ingevulde upgrades
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedTeamId}
            onChange={(event) => setSelectedTeamId(Number(event.target.value))}
            className="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-white"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} - {formatMoney(team.total_money)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPresetUpgrades(gameUpgrades)}
            disabled={Boolean(busy)}
          >
            Herstel presets
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<PlusIcon />}
            onClick={addPreset}
            disabled={Boolean(busy)}
          >
            Upgrade toevoegen
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {presetUpgrades.map((upgrade) => {
          const isCustomUpgrade = !gameUpgrades.some(
            (fallback) => fallback.key === upgrade.key,
          );
          const hasName = upgrade.name.trim().length > 0;
          const hasBoost = upgrade.incomeBoost > 0;
          const canAfford = selectedTeam
            ? selectedTeam.total_money >= upgrade.cost
            : false;
          const canBuy = hasName && hasBoost && canAfford;

          return (
            <article
              key={upgrade.key}
              className="rounded-lg border border-white/10 bg-slate-950/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <BoltIcon className="h-6 w-6 text-yellow-200" />
                <div className="flex items-center gap-2">
                  <span className="number-tabular rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                    +{formatMoney(upgrade.incomeBoost)}/min
                  </span>
                  {isCustomUpgrade ? (
                    <button
                      type="button"
                      aria-label="Upgrade verwijderen"
                      onClick={() => removePreset(upgrade.key)}
                      disabled={Boolean(busy)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3">
                <TextInput
                  label="Naam"
                  value={upgrade.name}
                  onChange={(event) =>
                    updatePreset(upgrade.key, "name", event.target.value)
                  }
                  maxLength={48}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Kost"
                    value={String(upgrade.cost)}
                    onChange={(event) =>
                      updatePreset(upgrade.key, "cost", event.target.value)
                    }
                    inputMode="numeric"
                  />
                  <TextInput
                    label="Extra per minuut"
                    value={String(upgrade.incomeBoost)}
                    onChange={(event) =>
                      updatePreset(
                        upgrade.key,
                        "incomeBoost",
                        event.target.value,
                      )
                    }
                    inputMode="numeric"
                  />
                </div>
                <TextInput
                  label="Omschrijving"
                  value={upgrade.description}
                  onChange={(event) =>
                    updatePreset(upgrade.key, "description", event.target.value)
                  }
                  maxLength={90}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-300">
                Kost {formatMoney(upgrade.cost)}
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                variant={canBuy ? "primary" : "secondary"}
                disabled={!canBuy || Boolean(busy)}
                onClick={() => buy(upgrade)}
              >
                {busy === upgrade.key
                  ? "Kopen..."
                  : !hasName || !hasBoost
                    ? "Vul upgrade in"
                    : canAfford
                      ? "Koop upgrade"
                      : "Te duur"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
