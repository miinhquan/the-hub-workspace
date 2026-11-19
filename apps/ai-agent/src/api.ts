import type { AdminDocument, Effects } from "./config";
export async function api<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}
export const loadPublished = () =>
  api<{ config: Effects; publishedAt?: string }>("config");
export const loadDraft = () => api<AdminDocument>("admin/draft");
