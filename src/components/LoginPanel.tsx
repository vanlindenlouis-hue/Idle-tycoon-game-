import { LockClosedIcon } from "@heroicons/react/24/outline";
import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";

export function LoginPanel({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(
    import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || "admin@example.com",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Aanmelden is mislukt. Controleer het wachtwoord.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.07] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-300 text-slate-950 shadow-glow">
            <LockClosedIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
              Admin
            </p>
            <h1 className="text-2xl font-black text-white">Aanmelden</h1>
          </div>
        </div>

        <div className="grid gap-4">
          <TextInput
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
          <TextInput
            label="Wachtwoord"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className="mt-5 w-full"
          disabled={busy}
        >
          {busy ? "Aanmelden..." : "Aanmelden"}
        </Button>
      </form>
    </main>
  );
}
