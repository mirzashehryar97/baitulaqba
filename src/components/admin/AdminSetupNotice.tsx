import { Database, KeyRound } from 'lucide-react';

export function AdminSetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-deepest px-5 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-gold/20 bg-offwhite p-7 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
          <Database className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold text-emerald-deep">
          Admin setup needed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Add the missing environment variables, then run the SQL in{' '}
          <span className="font-bold text-emerald-deep">supabase/schema.sql</span> inside your
          Supabase project.
        </p>

        <div className="mt-6 rounded-xl border border-emerald/10 bg-cream-soft p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-deep">
            <KeyRound className="h-4 w-4 text-gold-deep" />
            Missing values
          </div>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-ink/70">
            {missing.map((item) => (
              <li className="rounded-lg bg-white px-3 py-2" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
