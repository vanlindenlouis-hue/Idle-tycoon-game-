import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-amber-50">
      <div className="flex gap-3">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-amber-100/80">{body}</p>
        </div>
      </div>
    </div>
  );
}
