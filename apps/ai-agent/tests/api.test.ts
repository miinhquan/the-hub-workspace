import { beforeEach, describe, expect, it } from "vitest";
import {
  createSession,
  handleApi,
  securityHeaders,
  verifySession,
  type Bindings,
} from "../worker/api";
import { defaults } from "../src/config";
const origin = "https://preview.example";
let env: Bindings;
beforeEach(() => {
  const data = new Map<string, string>();
  env = {
    ADMIN_PASSWORD: "test-only-password-long-and-random",
    SESSION_SECRET: "test-only-session-secret-long-and-random",
    CONFIG: {
      async get(key) {
        return data.has(key) ? JSON.parse(data.get(key)!) : null;
      },
      async put(key, value) {
        data.set(key, value);
      },
    },
  };
});
function request(
  path: string,
  body?: unknown,
  cookie = "",
  requestOrigin = origin,
) {
  return new Request(origin + "/api/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function login() {
  const r = await handleApi(
    request("admin/login", { password: env.ADMIN_PASSWORD }),
    env,
  );
  expect(r.status).toBe(200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
describe("Preview admin security and persistence", () => {
  it("allows public published reads and requires auth for drafts and publish", async () => {
    expect((await handleApi(request("config"), env)).status).toBe(200);
    expect((await handleApi(request("admin/draft"), env)).status).toBe(401);
    expect(
      (await handleApi(request("admin/publish", { config: defaults }), env))
        .status,
    ).toBe(401);
  });
  it("fails closed when secrets are missing", async () => {
    env.SESSION_SECRET = "";
    expect((await handleApi(request("admin/me"), env)).status).toBe(503);
  });
  it("rejects cross-origin mutation even with a valid session", async () => {
    const cookie = await login();
    expect(
      (
        await handleApi(
          request(
            "admin/publish",
            { config: defaults },
            cookie,
            "https://attacker.example",
          ),
          env,
        )
      ).status,
    ).toBe(403);
  });
  it("issues a secure HttpOnly same-site cookie", async () => {
    const r = await handleApi(
      request("admin/login", { password: env.ADMIN_PASSWORD }),
      env,
    );
    expect(r.headers.get("set-cookie")).toMatch(
      /__Host-hub_ai=.*Secure; HttpOnly; SameSite=Strict/,
    );
  });
  it("verifies session authenticity and expiry", async () => {
    const now = Date.now(),
      token = await createSession(env.SESSION_SECRET, now);
    expect(await verifySession(token, env.SESSION_SECRET, now + 100)).toBe(
      true,
    );
    expect(
      await verifySession(token + "x", env.SESSION_SECRET, now + 100),
    ).toBe(false);
    expect(await verifySession(token, "wrong-secret", now + 100)).toBe(false);
    expect(
      await verifySession(token, env.SESSION_SECRET, now + 9 * 60 * 60 * 1000),
    ).toBe(false);
  });
  it("rate limits failed logins", async () => {
    for (let i = 0; i < 6; i++)
      expect(
        (
          await handleApi(
            request("admin/login", { password: "incorrect" }),
            env,
          )
        ).status,
      ).toBe(401);
    expect(
      (await handleApi(request("admin/login", { password: "incorrect" }), env))
        .status,
    ).toBe(429);
  });
  it("keeps draft changes separate until authenticated publish", async () => {
    const cookie = await login(),
      config = { ...defaults, orb: { ...defaults.orb, size: 250 } };
    const saved = await handleApi(
      request(
        "admin/draft",
        { draft: config, presets: [{ id: "a", name: "Custom", config }] },
        cookie,
      ),
      env,
    );
    expect(saved.status).toBe(200);
    expect(
      (await (await handleApi(request("config"), env)).json()).config.orb.size,
    ).toBe(330);
    expect(
      (
        await (
          await handleApi(request("admin/draft", undefined, cookie), env)
        ).json()
      ).draft.orb.size,
    ).toBe(250);
    expect(
      (await handleApi(request("admin/publish", { config }, cookie), env))
        .status,
    ).toBe(200);
    expect(
      (await (await handleApi(request("config"), env)).json()).config.orb.size,
    ).toBe(250);
  });
  it("validates server input independently of frontend", async () => {
    const cookie = await login();
    expect(
      (
        await handleApi(
          request(
            "admin/publish",
            { config: { ...defaults, orb: { ...defaults.orb, size: -999 } } },
            cookie,
          ),
          env,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleApi(
          request(
            "admin/draft",
            { draft: defaults, presets: Array(31).fill({}) },
            cookie,
          ),
          env,
        )
      ).status,
    ).toBe(400);
  });
  it("rejects unbounded request bodies and non-JSON inputs", async () => {
    expect(
      (
        await handleApi(
          request("admin/login", { password: "x".repeat(65000) }),
          env,
        )
      ).status,
    ).toBe(400);
    const r = new Request(origin + "/api/admin/login", {
      method: "POST",
      headers: { Origin: origin },
      body: "plain",
    });
    expect((await handleApi(r, env)).status).toBe(400);
  });
  it("clears the browser cookie on logout", async () => {
    const cookie = await login(),
      res = await handleApi(request("admin/logout", {}, cookie), env);
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  it("disables camera and microphone permissions in deployed responses", () => {
    expect(securityHeaders("text/html")).toHaveProperty(
      "Permissions-Policy",
      "microphone=(), camera=(), geolocation=()",
    );
  });
});
