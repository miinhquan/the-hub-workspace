import { defaults, validateEffects, type Preset } from "../src/config";
export type Storage = {
  get(key: string, type: "json"): Promise<unknown>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl: number },
  ): Promise<void>;
};
export type Bindings = {
  CONFIG: Storage;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  LOGIN_RATE?: { limit(input: { key: string }): Promise<{ success: boolean }> };
};
const cookieName = "__Host-hub_ai";
const encode = (s: string) => new TextEncoder().encode(s);
const hex = (a: ArrayBuffer) =>
  Array.from(new Uint8Array(a), (x) => x.toString(16).padStart(2, "0")).join(
    "",
  );
const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function createSession(secret: string, now = Date.now()) {
  const payload = `${now + 8 * 60 * 60 * 1000}:${crypto.randomUUID()}`;
  return `${payload}.${hex(await crypto.subtle.sign("HMAC", await signingKey(secret), encode(payload)))}`;
}
export async function verifySession(
  token: string,
  secret: string,
  now = Date.now(),
) {
  if (!secret || token.length > 200) return false;
  const [payload, signature, ...extra] = token.split(".");
  if (
    extra.length ||
    !payload ||
    !signature ||
    !/^\d{13}:[a-f0-9-]{36}$/.test(payload) ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const expiry = Number(payload.split(":")[0]);
  if (expiry <= now || expiry > now + 8 * 60 * 60 * 1000) return false;
  return crypto.subtle.verify(
    "HMAC",
    await signingKey(secret),
    Uint8Array.from(signature.match(/../g)!, (x) => parseInt(x, 16)),
    encode(payload),
  );
}
async function equalSecret(value: string, expected: string, secret: string) {
  const key = await signingKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encode(expected));
  return crypto.subtle.verify("HMAC", key, sig, encode(value));
}
async function body(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("Expected JSON");
  const reader = req.body?.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  if (!reader) throw new Error("Missing body");
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.length;
    if (bytes > 64000) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(chunk.value);
  }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder().decode(all));
}
export async function handleApi(
  req: Request,
  env: Bindings,
): Promise<Response> {
  const url = new URL(req.url),
    path = url.pathname;
  try {
    if (path === "/api/config" && req.method === "GET") {
      const saved = (await env.CONFIG.get("published", "json")) as {
        config: unknown;
        publishedAt?: string;
      } | null;
      return json(
        saved
          ? {
              config: validateEffects(saved.config),
              publishedAt: saved.publishedAt,
            }
          : { config: defaults },
      );
    }
    if (!path.startsWith("/api/admin/"))
      return json({ error: "Not found" }, 404);
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET)
      return json({ error: "Admin access is not configured." }, 503);
    if (req.method !== "GET" && req.headers.get("origin") !== url.origin)
      return json({ error: "Origin rejected" }, 403);
    const token =
      req.headers
        .get("cookie")
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1) || "";
    if (path === "/api/admin/login" && req.method === "POST") {
      const ip = req.headers.get("cf-connecting-ip") || "local";
      if (env.LOGIN_RATE && !(await env.LOGIN_RATE.limit({ key: ip })).success)
        return json({ error: "Too many attempts. Please wait a minute." }, 429);
      const rateKey = `login:${hex(await crypto.subtle.digest("SHA-256", encode(ip)))}:${Math.floor(Date.now() / 600000)}`;
      const attempts = Number(await env.CONFIG.get(rateKey, "json")) || 0;
      if (attempts >= 6)
        return json(
          { error: "Too many attempts. Try again in 10 minutes." },
          429,
        );
      const input = (await body(req)) as { password?: unknown };
      if (
        typeof input.password !== "string" ||
        input.password.length > 256 ||
        !(await equalSecret(
          input.password,
          env.ADMIN_PASSWORD,
          env.SESSION_SECRET,
        ))
      ) {
        await env.CONFIG.put(rateKey, JSON.stringify(attempts + 1), {
          expirationTtl: 600,
        });
        return json({ error: "The password is incorrect." }, 401);
      }
      const session = await createSession(env.SESSION_SECRET);
      // __Host- cookies require HTTPS. Loopback dev uses the same secure cookie; modern browsers trust localhost.
      return json({ ok: true }, 200, {
        "Set-Cookie": `${cookieName}=${session}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`,
      });
    }
    if (!(await verifySession(token, env.SESSION_SECRET)))
      return json({ error: "Admin sign-in required." }, 401);
    if (path === "/api/admin/me" && req.method === "GET")
      return json({ role: "admin" });
    if (path === "/api/admin/logout" && req.method === "POST")
      return json({ ok: true }, 200, {
        "Set-Cookie": `${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`,
      });
    if (path === "/api/admin/draft" && req.method === "GET") {
      return json(
        (await env.CONFIG.get("draft", "json")) || {
          draft: defaults,
          presets: [],
        },
      );
    }
    if (path === "/api/admin/draft" && req.method === "POST") {
      const input = (await body(req)) as { draft: unknown; presets: Preset[] };
      const draft = validateEffects(input.draft);
      if (!Array.isArray(input.presets) || input.presets.length > 30)
        throw new Error("Up to 30 presets are supported.");
      const presets = input.presets.map((p) => {
        if (
          typeof p.id !== "string" ||
          p.id.length > 80 ||
          typeof p.name !== "string" ||
          p.name.length < 1 ||
          p.name.length > 60
        )
          throw new Error("Invalid preset.");
        return { id: p.id, name: p.name, config: validateEffects(p.config) };
      });
      const doc = { draft, presets, updatedAt: new Date().toISOString() };
      await env.CONFIG.put("draft", JSON.stringify(doc));
      return json(doc);
    }
    if (path === "/api/admin/publish" && req.method === "POST") {
      const input = (await body(req)) as { config: unknown };
      const config = validateEffects(input.config),
        publishedAt = new Date().toISOString();
      await env.CONFIG.put(
        "published",
        JSON.stringify({ config, publishedAt }),
      );
      return json({ config, publishedAt });
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      400,
    );
  }
}
export function securityHeaders(
  contentType: string,
  cache = "no-store",
): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "microphone=(), camera=(), geolocation=()",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
    "X-Robots-Tag": "noindex, nofollow",
    "Strict-Transport-Security": "max-age=31536000",
  };
}
