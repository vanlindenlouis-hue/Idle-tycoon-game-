import {
  ArrowPathIcon,
  BanknotesIcon,
  MinusCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { Team } from "../types/game";
import { formatMoney } from "../utils/format";
import { playKaching } from "../utils/sound";
import {
  addMoney,
  increaseIncome,
  resetTeam,
  setIncome,
  subtractMoney,
  updateTeamProfile,
} from "../services/teamService";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { ColorPicker } from "./ColorPicker";
import { ConfirmModal } from "./ConfirmModal";

const incomeButtons = [10, 25, 50, 100, 250, 500, 1000];
const moneyButtons = [100, 250, 500, 1000, 5000];

function numericInput(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function AdminTeamPanel({
  team,
  onChanged,
}: {
  team: Team;
  onChanged: () => void | Promise<void>;
}) {
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.color);
  const [freeIncome, setFreeIncome] = useState("");
  const [freeAdd, setFreeAdd] = useState("");
  const [freeSubtract, setFreeSubtract] = useState("");
  const [incomeValue, setIncomeValue] = useState(String(team.income_per_minute));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setName(team.name);
    setColor(team.color);
    setIncomeValue(String(team.income_per_minute));
  }, [team.color, team.income_per_minute, team.name]);

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    setSuccess(null);

    try {
      await action();
      await onChanged();
      setSuccess("Actie opgeslagen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actie is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <h2 className="text-xl font-black text-white">{team.name}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {formatMoney(team.total_money)} · {formatMoney(team.income_per_minute)}
            /min · {team.upgrade_count} upgrades
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          icon={<ArrowPathIcon />}
          onClick={() => setConfirmReset(true)}
          disabled={Boolean(busy)}
        >
          Reset team
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
            <PlusCircleIcon className="h-5 w-5 text-teal-200" />
            Inkomen verhogen
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {incomeButtons.map((amount) => (
              <Button
                key={amount}
                type="button"
                onClick={() =>
                  run(`income-${amount}`, async () => {
                    await increaseIncome(team.id, amount, `+${amount} €/min`);
                    playKaching();
                  })
                }
                disabled={Boolean(busy)}
              >
                +{amount}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Vrije inkomensverhoging"
              value={freeIncome}
              onChange={(event) => setFreeIncome(event.target.value)}
              inputMode="numeric"
              placeholder="Vrij bedrag"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
            />
            <Button
              type="button"
              variant="primary"
              disabled={Boolean(busy) || numericInput(freeIncome) <= 0}
              onClick={() =>
                run("free-income", async () => {
                  await increaseIncome(
                    team.id,
                    numericInput(freeIncome),
                    "Vrije inkomensverhoging",
                  );
                  setFreeIncome("");
                  playKaching();
                })
              }
            >
              Voeg toe
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
            <BanknotesIcon className="h-5 w-5 text-emerald-200" />
            Geld toevoegen
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {moneyButtons.map((amount) => (
              <Button
                key={amount}
                type="button"
                onClick={() =>
                  run(`add-${amount}`, () =>
                    addMoney(team.id, amount, `+${amount} geld`),
                  )
                }
                disabled={Boolean(busy)}
              >
                +{amount}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Vrij geld toevoegen"
              value={freeAdd}
              onChange={(event) => setFreeAdd(event.target.value)}
              inputMode="numeric"
              placeholder="Vrij bedrag"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
            />
            <Button
              type="button"
              variant="primary"
              disabled={Boolean(busy) || numericInput(freeAdd) <= 0}
              onClick={() =>
                run("free-add", async () => {
                  await addMoney(team.id, numericInput(freeAdd), "Vrij geld");
                  setFreeAdd("");
                })
              }
            >
              Voeg toe
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
            <MinusCircleIcon className="h-5 w-5 text-rose-200" />
            Geld aftrekken
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {moneyButtons.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="danger"
                onClick={() =>
                  run(`subtract-${amount}`, () =>
                    subtractMoney(team.id, amount, `-${amount} geld`),
                  )
                }
                disabled={Boolean(busy)}
              >
                -{amount}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Vrij geld aftrekken"
              value={freeSubtract}
              onChange={(event) => setFreeSubtract(event.target.value)}
              inputMode="numeric"
              placeholder="Vrij bedrag"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
            />
            <Button
              type="button"
              variant="danger"
              disabled={Boolean(busy) || numericInput(freeSubtract) <= 0}
              onClick={() =>
                run("free-subtract", async () => {
                  await subtractMoney(
                    team.id,
                    numericInput(freeSubtract),
                    "Vrij geld aftrekken",
                  );
                  setFreeSubtract("");
                })
              }
            >
              Trek af
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
            <PencilSquareIcon className="h-5 w-5 text-sky-200" />
            Team aanpassen
          </h3>
          <div className="grid gap-3">
            <TextInput
              label="Teamnaam"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Teamkleur
              </span>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex gap-2">
              <input
                aria-label="Inkomen per minuut"
                value={incomeValue}
                onChange={(event) => setIncomeValue(event.target.value)}
                inputMode="numeric"
                placeholder="Bijvoorbeeld 4125"
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white"
              />
              <Button
                type="button"
                disabled={Boolean(busy)}
                onClick={() =>
                  run("set-income", () =>
                    setIncome(team.id, numericInput(incomeValue)),
                  )
                }
              >
                Zet €/min
              </Button>
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={Boolean(busy) || !name.trim()}
              onClick={() =>
                run("profile", () =>
                  updateTeamProfile(team.id, name.trim(), color),
                )
              }
            >
              Naam en kleur opslaan
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <SpeakerWaveIcon className="h-4 w-4" />
        Upgrade-acties spelen alleen hier een kort geluid.
      </p>

      {confirmReset ? (
        <ConfirmModal
          title={`${team.name} resetten?`}
          body="Het team gaat terug naar €0, 0 upgrades en €100 per minuut."
          confirmLabel="Reset team"
          busy={Boolean(busy)}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() =>
            run("reset-team", async () => {
              await resetTeam(team.id);
              setConfirmReset(false);
            })
          }
        />
      ) : null}
    </section>
  );
}
