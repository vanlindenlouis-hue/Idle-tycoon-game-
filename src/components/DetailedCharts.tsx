import type { Team, Transaction, TransactionType } from "../types/game";
import { formatMoney, formatTime } from "../utils/format";

const chartWidth = 560;
const chartHeight = 230;
const padding = { top: 18, right: 18, bottom: 34, left: 58 };
const plotWidth = chartWidth - padding.left - padding.right;
const plotHeight = chartHeight - padding.top - padding.bottom;

const typeLabels: Record<TransactionType, string> = {
  income: "Inkomen",
  money_added: "Geld erbij",
  money_removed: "Geld eraf",
  upgrade_purchase: "Upgrade",
  income_adjusted: "Inkomen aangepast",
  profile_updated: "Profiel",
  team_reset: "Team reset",
  activity_reset: "Alles reset",
};

const typeColors: Record<TransactionType, string> = {
  income: "#2dd4bf",
  money_added: "#22c55e",
  money_removed: "#fb7185",
  upgrade_purchase: "#facc15",
  income_adjusted: "#38bdf8",
  profile_updated: "#a78bfa",
  team_reset: "#f97316",
  activity_reset: "#f97316",
};

function formatSignedMoney(value: number) {
  const formatted = formatMoney(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  transaction?: Transaction;
};

function buildPoints(
  transactions: Transaction[],
  currentTotal: number,
): { points: ChartPoint[]; min: number; max: number } {
  const recent = transactions.slice(-42);
  const values = recent.map((transaction) => transaction.balance_after);
  const series = [...values, currentTotal];
  const rawMin = Math.min(0, ...series);
  const rawMax = Math.max(100, ...series);
  const spread = Math.max(1, rawMax - rawMin);
  const min = Math.max(0, rawMin - spread * 0.08);
  const max = rawMax + spread * 0.12;
  const range = Math.max(1, max - min);

  const points = series.map((value, index) => {
    const x =
      padding.left + (index / Math.max(1, series.length - 1)) * plotWidth;
    const y =
      padding.top + plotHeight - ((value - min) / range) * plotHeight;

    return {
      x,
      y,
      value,
      transaction: recent[index],
    };
  });

  return { points, min, max };
}

function linePath(points: ChartPoint[]) {
  if (points.length === 0) return "";

  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
}

function areaPath(points: ChartPoint[]) {
  if (points.length === 0) return "";

  const line = linePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  const floor = padding.top + plotHeight;

  return `${line} L ${last.x.toFixed(1)} ${floor} L ${first.x.toFixed(
    1,
  )} ${floor} Z`;
}

function gridLines(min: number, max: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = max - (max - min) * ratio;
    const y = padding.top + plotHeight * ratio;
    return { value, y };
  });
}

function netChange(transactions: Transaction[], currentTotal: number) {
  const first = transactions.at(-42)?.balance_after ?? 0;
  return currentTotal - first;
}

function biggestMove(transactions: Transaction[]) {
  return transactions
    .slice(-42)
    .reduce(
      (best, transaction) =>
        Math.abs(transaction.amount) > Math.abs(best.amount)
          ? transaction
          : best,
      { amount: 0 } as Transaction,
    );
}

export function DetailedCharts({
  teams,
  transactionsByTeam,
}: {
  teams: Team[];
  transactionsByTeam: Record<number, Transaction[]>;
}) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            Analyse
          </p>
          <h2 className="text-2xl font-black text-white">Detailgrafieken</h2>
        </div>
        <p className="text-sm text-slate-400">
          Laatste 42 transacties per team, inclusief huidig saldo.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {teams.map((team) => {
          const transactions = transactionsByTeam[team.id] ?? [];
          const { points, min, max } = buildPoints(
            transactions,
            team.total_money,
          );
          const latest = transactions.at(-1);
          const net = netChange(transactions, team.total_money);
          const biggest = biggestMove(transactions);
          const gradientId = `detail-chart-${team.id}`;

          return (
            <article
              key={team.id}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <h3 className="truncate text-xl font-black text-white">
                      {team.name}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {transactions.length} transacties geregistreerd
                  </p>
                </div>
                <div className="text-right">
                  <p className="number-tabular text-2xl font-black text-white">
                    {formatMoney(team.total_money)}
                  </p>
                  <p
                    className={`number-tabular text-sm font-bold ${
                      net >= 0 ? "text-emerald-200" : "text-rose-200"
                    }`}
                  >
                    {formatSignedMoney(net)}
                  </p>
                </div>
              </div>

              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={`Detailgrafiek voor ${team.name}`}
                className="h-72 w-full overflow-visible"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={team.color} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={team.color} stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {gridLines(min, max).map((line) => (
                  <g key={line.y}>
                    <path
                      d={`M ${padding.left} ${line.y.toFixed(
                        1,
                      )} L ${chartWidth - padding.right} ${line.y.toFixed(1)}`}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={line.y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-semibold"
                    >
                      {formatMoney(line.value)}
                    </text>
                  </g>
                ))}

                <path d={areaPath(points)} fill={`url(#${gradientId})`} />
                <path
                  d={linePath(points)}
                  fill="none"
                  stroke={team.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />

                {points.slice(-18).map((point, index) => {
                  const transaction = point.transaction;
                  const fill = transaction
                    ? typeColors[transaction.type]
                    : team.color;

                  return (
                    <circle
                      key={`${point.x}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={transaction ? 4.5 : 6}
                      fill={fill}
                      stroke="#020617"
                      strokeWidth="2"
                    />
                  );
                })}

                <text
                  x={padding.left}
                  y={chartHeight - 10}
                  className="fill-slate-500 text-[10px] font-semibold"
                >
                  {transactions.at(-42)
                    ? formatTime(transactions.at(-42)!.created_at)
                    : "Start"}
                </text>
                <text
                  x={chartWidth - padding.right}
                  y={chartHeight - 10}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-semibold"
                >
                  Nu
                </text>
              </svg>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Laatste actie
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {latest ? typeLabels[latest.type] : "Nog geen actie"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Grootste mutatie
                  </p>
                  <p className="number-tabular mt-1 text-sm font-bold text-white">
                    {formatMoney(Math.abs(biggest.amount))}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Per minuut
                  </p>
                  <p className="number-tabular mt-1 text-sm font-bold text-white">
                    {formatMoney(team.income_per_minute)}/min
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
