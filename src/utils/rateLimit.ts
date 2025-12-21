const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW = 60_000;
const LIMIT = 100;

export function rateLimit(ip: string) {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }

  if (entry.count >= LIMIT) return false;

  entry.count++;
  return true;
}
