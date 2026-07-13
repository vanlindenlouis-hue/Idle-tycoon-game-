import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/Button";

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="flex gap-3">
          <ExclamationTriangleIcon className="mt-1 h-6 w-6 shrink-0 text-amber-200" />
          <div>
            <h2 className="text-xl font-black text-white">{title}</h2>
            <p className="mt-2 leading-6 text-slate-300">{body}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onCancel} variant="ghost" disabled={busy}>
            Annuleren
          </Button>
          <Button onClick={onConfirm} variant="danger" disabled={busy}>
            {busy ? "Bezig..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
