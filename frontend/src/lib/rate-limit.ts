import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// En memoria por instancia: frena fuerza bruta básica en un solo proceso (Render).
// Con varias instancias, el límite real lo pone Supabase Auth + CAPTCHA.
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** true si la acción está permitida; false si se superó el límite de la ventana. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
