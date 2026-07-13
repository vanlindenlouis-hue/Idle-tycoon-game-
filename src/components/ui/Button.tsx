import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-teal-300/40 bg-teal-300 text-slate-950 hover:bg-teal-200 shadow-glow",
  secondary:
    "border-white/10 bg-white/10 text-slate-100 hover:bg-white/15 hover:border-white/20",
  danger:
    "border-rose-400/40 bg-rose-500/18 text-rose-100 hover:bg-rose-500/28",
  ghost:
    "border-transparent bg-transparent text-slate-300 hover:bg-white/10 hover:text-white",
};

export function Button({
  children,
  className = "",
  variant = "secondary",
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon ? <span className="h-5 w-5 shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}
