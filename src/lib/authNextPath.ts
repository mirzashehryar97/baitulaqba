// Guards the `next` redirect target used by the auth login/callback routes
// against open-redirects: only same-origin, single-slash absolute paths are
// allowed; anything else falls back to the admin area.
export function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) {
    return '/admin';
  }

  if (value.startsWith('//')) {
    return '/admin';
  }

  return value;
}
