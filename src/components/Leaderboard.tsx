import { TrophyIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import type { Team } from "../types/game";
import { formatMoney } from "../utils/format";

const labels = ["🥇", "🥈", "🥉", "4e"];

export function Leaderboard({ teams }: { teams: Team[] }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrophyIcon className="h-6 w-6 text-yellow-200" />
        <h2 className="text-lg font-black text-white">Leaderboard</h2>
      </div>
      <div className="grid gap-2">
        {teams.map((team, index) => (
          <motion.div
            layout
            key={team.id}
            className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2"
          >
            <span className="text-xl font-black">{labels[index] ?? index + 1}</span>
            <span className="min-w-0 truncate font-semibold text-white">
              {team.name}
            </span>
            <span className="number-tabular text-sm font-bold text-slate-200">
              {formatMoney(team.total_money)}
            </span>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
