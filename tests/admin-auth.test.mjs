import assert from "node:assert/strict";
import test from "node:test";
import {
  adminSessionCookie,
  authorizeAdminRequest,
  createAdminSessionToken,
  hasAdminSession,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from "../lib/admin-auth.ts";

const env = {
  ADMIN_PASSWORD: "a-strong-admin-password",
  ADMIN_SESSION_SECRET: "a-session-signing-secret-with-at-least-32-bytes",
};

function request({ cookie, origin = "https://shop.example", extraHeaders } = {}) {
  const headers = new Headers(extraHeaders);
  if (cookie) headers.set("Cookie", cookie.split(";")[0]);
  if (origin) headers.set("Origin", origin);
  return new Request("https://shop.example/api/products", { method: "POST", headers });
}

test("admin setup requires a long password and signing secret", () => {
  assert.equal(isAdminAuthConfigured(env), true);
  assert.equal(isAdminAuthConfigured({ ...env, ADMIN_PASSWORD: "short" }), false);
  assert.equal(isAdminAuthConfigured({ ...env, ADMIN_SESSION_SECRET: "short" }), false);
});

test("admin password verification rejects incorrect credentials", async () => {
  assert.equal(await verifyAdminPassword(env.ADMIN_PASSWORD, env), true);
  assert.equal(await verifyAdminPassword("wrong-password", env), false);
});

test("unauthenticated product writes are denied", async () => {
  const denied = await authorizeAdminRequest(
    request({
      extraHeaders: {
        "x-admin-role": "admin",
        "oai-authenticated-user-id": "forged-admin",
      },
    }),
    env,
  );
  assert.equal(denied?.status, 401);
});

test("writes without an Origin header are denied", async () => {
  const denied = await authorizeAdminRequest(request({ origin: null }), env);
  assert.equal(denied?.status, 403);
});

test("requests from another origin are denied even with an admin cookie", async () => {
  const token = await createAdminSessionToken(env);
  const denied = await authorizeAdminRequest(
    request({
      cookie: adminSessionCookie(token),
      origin: "https://attacker.example",
    }),
    env,
  );
  assert.equal(denied?.status, 403);
});

test("signed admin sessions authorize same-origin product writes", async () => {
  const token = await createAdminSessionToken(env);
  const cookie = adminSessionCookie(token);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  const authenticatedRequest = request({ cookie });
  assert.equal(await hasAdminSession(authenticatedRequest, env), true);
  assert.equal(await authorizeAdminRequest(authenticatedRequest, env), null);
});

test("tampered sessions and missing auth configuration fail closed", async () => {
  const token = await createAdminSessionToken(env);
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(
    await hasAdminSession(request({ cookie: `__Host-atelier_admin=${tampered}` }), env),
    false,
  );
  const denied = await authorizeAdminRequest(request(), {});
  assert.equal(denied?.status, 503);
});
