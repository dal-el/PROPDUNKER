export function inferApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (env) return env;

  // If opened from another device (mobile) over LAN, "localhost" points to the phone.
  // Use the same hostname as the frontend page, but port 8000 for the API.
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiProto = protocol === "https:" ? "https:" : "http:";
    return `${apiProto}//${hostname}:8000`;
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE = inferApiBase().replace(/\/$/, "");

// default: use real data unless explicitly enabled
export const USE_DUMMIES = process.env.NEXT_PUBLIC_USE_DUMMIES === "true";

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
