import { BrandMark } from '@/components/ui/BrandMark';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';

const errorMessages: Record<string, string> = {
  auth_failed: 'Google sign-in could not be completed. Please try again.',
  missing_code: 'Google did not return a valid sign-in code. Please try again.',
  not_allowed: 'This Google account is not an active admin or team member.',
};

export function AdminLogin({ errorCode }: { errorCode?: string }) {
  const error = errorCode ? (errorMessages[errorCode] ?? 'Could not sign in.') : null;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-emerald-deepest bg-cover bg-center px-5 py-12"
      style={{ backgroundImage: "url('/images/login/admin-login-bg.png')" }}
    >
      <div className="absolute inset-0 bg-emerald-deepest/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_45%,rgba(255,248,230,0.12),transparent_34%),linear-gradient(90deg,rgba(8,34,31,0.2),rgba(8,34,31,0.68))]" />

      <div className="relative z-10 flex w-full max-w-6xl justify-center md:justify-end">
        <div className="w-full max-w-md rounded-2xl border border-gold/25 bg-offwhite/95 p-7 shadow-card backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-cream-soft p-1.5 shadow-sm">
            <BrandMark className="h-full w-full" priority />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold text-emerald-deep">
            Bait ul Aqba Admin
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Sign in with the Google account that has been added to the team allowlist.
          </p>

          <GoogleSignInButton href="/auth/login?next=/admin" />

          {error ? (
            <p className="mt-4 rounded-lg border border-red-700/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-xs font-semibold leading-relaxed text-ink/45">
            Access is blocked unless your email exists in the active team members list.
          </p>
        </div>
      </div>
    </main>
  );
}
