import type { Transaction } from "../types/game";
import { formatMoney } from "../utils/format";

type Point = {
  x: number;
  y: number;
  value: number;
};

const width = 240;
const height = 92;
const padding = 10;
const plotHeight = height - padding * 2;

function buildPoints(values: number[]): Point[] {
  if (values.length === 0) {
    return [
      { x: padding, y: height * 0.7, value: 0 },
      { x: width - padding, y: height * 0.35, value: 0 },
    ];
  }

  const min = Math.min(0, ...values);
  const max = Math.max(100, ...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x =
        padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y = padding + plotHeight - ((value - min) / range) * plotHeight;
      return { x, y, value };
    });
}

function buildPath(points: Point[]): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");
}

function buildArea(points: Point[]): string {
  if (points.length === 0) return "";

  const floor = height - padding;
  const first = points[0];
  const last = points[points.length - 1];

  return `${buildPath(points)} L ${last.x.toFixed(1)} ${floor} L ${first.x.toFixed(
    1,
  )} ${floor} Z`;
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
    ...transactions.slice(-30).map((transaction) => transaction.balance_after),
    currentTotal,
  ];
  const points = buildPoints(values);
  const path = buildPath(points);
  const area = buildArea(points);
  const current = points.at(-1)?.value ?? currentTotal;
  const max = Math.max(...values, currentTotal, 100);
  const gradientId = `chart-${color.replace("#", "")}`;
  const recentPoints = points.slice(-6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Geld evolutie" className="h-24 w-full overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${gradientId}-area`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <path
          key={ratio}
          d={`M ${padding} ${(height * ratio).toFixed(1)} L ${
            width - padding
          } ${(height * ratio).toFixed(1)}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill={`url(#${gradientId}-area)`} />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      {recentPoints.map((point, index) => {
        const isCurrentPoint = index === recentPoints.length - 1;

        return (
          <circle
            key={`${point.x}-${index}`}
            cx={point.x}
            cy={point.y}
            r={isCurrentPoint ? 4 : 2.8}
            fill={isCurrentPoint ? color : "rgba(255,255,255,0.75)"}
            stroke="#020617"
            strokeWidth="1.5"
          />
        );
      })}
      <text x={padding} y="10" className="fill-slate-500 text-[9px] font-semibold">
        max {formatMoney(max)}
      </text>
      <text
        x={width - padding}
        y="86"
        textAnchor="end"
        className="fill-slate-400 text-[10px] font-bold"
      >
        nu {formatMoney(current)}
      </text>
    </svg>
  );
}
