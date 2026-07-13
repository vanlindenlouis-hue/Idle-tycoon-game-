# Idle Tycoon Game

Een productieklare React + Vite applicatie voor een live Chiro-activiteit met vier teams. Het publieke scherm is een groot realtime scoreboard; het adminscherm laat organisatoren geld, inkomen, teamgegevens, resets en Game Master-upgrades beheren.

## Functionaliteit

- Exact vier teams met naam, kleur, totaal geld, inkomen per minuut, upgrades en `last_income_update`.
- Publiek dashboard zonder login, geschikt voor projectie.
- Admin dashboard met Supabase Auth.
- Geld toevoegen, geld aftrekken, inkomen verhogen, inkomen vrij instellen, naam/kleur wijzigen en resets.
- Game Master-pagina met vaste upgrades zoals Extra kassier, Zelfscan en Magazijnuitbreiding.
- Adminlogs voor elke beheeractie met oude en nieuwe waarde.
- Transactions-tabel voor geldgeschiedenis en mini-grafieken.
- Supabase Realtime voor automatische schermupdates.
- Framer Motion teller- en kaartanimaties.
- Kaching-geluid bij upgrade-acties op het adminscherm.

## Technische keuzes

De inkomstenlogica gebruikt `last_income_update` in de database. De RPC `apply_income_for_team` berekent hoeveel volledige blokken van 30 seconden verstreken zijn en boekt exact:

```text
inkomen = aantal_30s_ticks * (income_per_minute / 2)
```

Daardoor is de berekening idempotent. Als de Edge Function, browser of cron later binnenkomt, worden gemiste ticks ingehaald zonder dubbel geld toe te kennen.

## Projectstructuur

```text
src/
  components/
  hooks/
  pages/
  services/
  supabase/
  types/
  utils/
supabase/
  functions/income-tick/
  sql/
```

## Installatie

```bash
pnpm install
cp .env.example .env
```

Vul daarna `.env` in:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DEFAULT_ADMIN_EMAIL=admin@example.com
```

## Supabase aanmaken

1. Maak een nieuw Supabase-project.
2. Open SQL Editor.
3. Voer `supabase/sql/001_schema.sql` uit.
4. Voer `supabase/sql/002_seed.sql` uit.
5. Ga naar Authentication en maak een gebruiker aan met hetzelfde e-mailadres als in `settings.admin_emails`.
6. Pas indien nodig de adminlijst aan:

```sql
update public.settings
set value = '["jouw-admin@example.com"]'::jsonb
where key = 'admin_emails';
```

## Edge Function

Deploy de server-side income tick:

```bash
supabase functions deploy income-tick
```

De function roept `apply_income_for_all()` aan met de service role key. Zet in Supabase de standaard function secrets:

```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Plan de function via Supabase Scheduled Functions of een externe scheduler. Een minuutinterval is voldoende, omdat de SQL-functie twee 30-seconden-ticks verwerkt als er 60 seconden verstreken zijn. Als je een scheduler hebt die elke 30 seconden kan triggeren, mag dat ook.

`supabase/sql/003_cron_example.sql` bevat een pg_cron voorbeeld voor projecten waar `pg_net` en database settings voor `app.settings.supabase_url` en `app.settings.service_role_key` gebruikt worden.

## Lokaal starten

```bash
pnpm run dev
```

Routes:

- Publiek scoreboard: `http://localhost:5173/`
- Admin dashboard: `http://localhost:5173/admin`
- Game Master-tab: `http://localhost:5173/game-master`

Zonder Supabase-env toont het publieke scherm alleen de vier seedteams als veilige lokale preview. Adminacties zijn dan uitgeschakeld.

## Build

```bash
pnpm run build
```

De statische productiebuild komt in `dist/`.

## Deployen

Voor de frontend kun je elke statische host gebruiken die Vite ondersteunt, zoals Netlify, Vercel, Cloudflare Pages of Supabase Hosting:

```bash
pnpm run build
```

Publiceer daarna `dist/` en zet dezelfde `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en `VITE_DEFAULT_ADMIN_EMAIL` als build environment variables.

De Edge Function wordt apart via Supabase gedeployed.

## GitHub

Deze repo is bedoeld als:

```text
supermarket-tycoon-dashboard
```

Met GitHub CLI:

```bash
gh repo create supermarket-tycoon-dashboard --private --source=. --remote=origin --push
```

Zonder GitHub CLI:

```bash
git remote add origin https://github.com/<user>/supermarket-tycoon-dashboard.git
git push -u origin main
```

## Scripts

- `pnpm run dev` start Vite.
- `pnpm run build` draait TypeScript en maakt de productiebuild.
- `pnpm run preview` serveert de productiebuild lokaal.

## Veiligheid

- Publiek dashboard heeft alleen leesrechten.
- Adminmutaties lopen via beveiligde RPC-functies.
- RPC-mutaties controleren `public.is_admin()`.
- RLS staat aan op `teams`, `transactions`, `admin_logs` en `settings`.
- Geld aftrekken gebruikt `greatest(0, ...)`, dus een team kan nooit negatief gaan.
