import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({ label, className = "", ...props }: TextInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        className={`min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white shadow-inner outline-none transition placeholder:text-slate-600 focus:border-teal-300/60 ${className}`}
        {...props}
      />
    </label>
  );
}
