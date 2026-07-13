import {
  ArrowTrendingUpIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Team, Transaction } from "../types/game";
import { formatMoney, formatNumber } from "../utils/format";
import { MiniChart } from "./MiniChart";
import { MoneyCounter } from "./MoneyCounter";

const rankLabels = ["🥇", "🥈", "🥉", "4e"];

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className="h-4 w-4 shrink-0 text-slate-300">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="number-tabular truncate text-base font-bold text-white">
        {value}
      </p>
    </div>
  );
}

export function TeamCard({
  team,
  rank,
  transactions,
}: {
  team: Team;
  rank: number;
  transactions: Transaction[];
}) {
  const previousMoney = useRef(team.total_money);
  const [isRising, setIsRising] = useState(false);

  useEffect(() => {
    if (team.total_money > previousMoney.current) {
      setIsRising(true);
      const timeout = window.setTimeout(() => setIsRising(false), 900);
      previousMoney.current = team.total_money;
      return () => window.clearTimeout(timeout);
    }

    previousMoney.current = team.total_money;
    return undefined;
  }, [team.total_money]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, scale: isRising ? 1.018 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="relative overflow-hidden rounded-lg border border-white/12 bg-white/[0.07] p-5 shadow-2xl"
      style={{ boxShadow: `0 0 34px ${team.color}24` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: team.color }}
      />
      {isRising ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7 }}
        />
      ) : null}

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-black text-slate-950"
                style={{ backgroundColor: team.color }}
              >
                {rankLabels[rank] ?? `${rank + 1}e`}
              </span>
              <h2 className="truncate text-2xl font-black text-white md:text-3xl">
                {team.name}
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-400">
              Supermarktwaarde
            </p>
          </div>
          <ShoppingCartIcon className="h-12 w-12 shrink-0 text-white/20" />
        </div>

        <MoneyCounter
          value={team.total_money}
          className="block text-4xl font-black leading-none text-white md:text-5xl"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat
            icon={<ArrowTrendingUpIcon />}
            label="Per minuut"
            value={`${formatMoney(team.income_per_minute)}/min`}
          />
          <Stat
            icon={<SparklesIcon />}
            label="Upgrades"
            value={formatNumber(team.upgrade_count)}
          />
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CurrencyEuroIcon className="h-4 w-4" />
            <span>Laatste evolutie</span>
          </div>
          <MiniChart
            transactions={transactions}
            currentTotal={team.total_money}
            color={team.color}
          />
        </div>
      </div>
    </motion.article>
  );
}
