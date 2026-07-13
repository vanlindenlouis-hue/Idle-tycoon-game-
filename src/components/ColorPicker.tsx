import { teamColors } from "../utils/gameData";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {teamColors.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          aria-label={`Kies kleur ${color}`}
          onClick={() => onChange(color)}
          className={`h-9 w-9 rounded-lg border transition ${
            value.toLowerCase() === color.toLowerCase()
              ? "border-white shadow-glow"
              : "border-white/15 hover:border-white/40"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <input
        aria-label="Eigen kleur"
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
      />
    </div>
  );
}
