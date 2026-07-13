import type { Transaction } from "../types/game";

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) {
    return `M 0 ${height * 0.65} L ${width} ${height * 0.35}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function MiniChart({
  transactions,
  currentTotal,
  color,
}: {
  transactions: Transaction[];
  currentTotal: number;
  color: string;
}) {
  const values = [
    ...transactions.slice(-18).map((transaction) => transaction.balance_after),
    currentTotal,
  ];
  const path = buildPath(values, 220, 72);

  return (
    <svg
      viewBox="0 0 220 72"
      role="img"
      aria-label="Geld evolutie"
      className="h-20 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`chart-${color.replace("#", "")}`} x1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M 0 58 L 220 58"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#chart-${color.replace("#", "")})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}
