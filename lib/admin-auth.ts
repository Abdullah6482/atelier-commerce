export type AdminAuthEnv = {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

const ADMIN_COOKIE = "__Host-atelier_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const encoder = new TextEncoder();

export function isAdminAuthConfigured(env: AdminAuthEnv): boolean {
  return (
    byteLength(env.ADMIN_PASSWORD) >= 16 &&
    byteLength(env.ADMIN_SESSION_SECRET) >= 32
  );
}

export async function verifyAdminPassword(
  password: string,
  env: AdminAuthEnv,
): Promise<boolean> {
  if (!isAdminAuthConfigured(env) || password.length > 1024) return false;
  const [submitted, expected] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(password)),
    crypto.subtle.digest("SHA-256", encoder.encode(env.ADMIN_PASSWORD!)),
  ]);
  return constantTimeEqual(new Uint8Array(submitted), new Uint8Array(expected));
}

export async function createAdminSessionToken(
  env: AdminAuthEnv,
): Promise<string> {
  if (!isAdminAuthConfigured(env)) {
    throw new Error("Admin authentication secrets are not configured.");
  }

  const payload = encodeBase64Url(
    encoder.encode(
      JSON.stringify({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      }),
    ),
  );
  const signature = await sign(payload, env.ADMIN_SESSION_SECRET!);
  return `${payload}.${encodeBase64Url(signature)}`;
}

export async function hasAdminSession(
  request: Request,
  env: AdminAuthEnv,
): Promise<boolean> {
  if (!isAdminAuthConfigured(env)) return false;
  const token = readAdminCookie(request.headers.get("Cookie"));
  if (!token || token.length > 2048) return false;

  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra !== undefined) return false;

  try {
    const signature = decodeBase64Url(encodedSignature);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.ADMIN_SESSION_SECRET!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(payload),
    );
    if (!valid) return false;

    const session = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    ) as { role?: unknown; exp?: unknown };
    return (
      session.role === "admin" &&
      typeof session.exp === "number" &&
      Number.isInteger(session.exp) &&
      session.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function authorizeAdminRequest(
  request: Request,
  env: AdminAuthEnv,
): Promise<Response | null> {
  if (!isAdminAuthConfigured(env)) {
    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!(await hasAdminSession(request, env))) {
    return Response.json(
      { error: "Admin sign-in is required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function adminSessionCookie(token: string): string {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearAdminSessionCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readAdminCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const prefix = `${ADMIN_COOKIE}=`;
  for (const cookie of cookieHeader.split(";")) {
    const item = cookie.trim();
    if (item.startsWith(prefix)) return item.slice(prefix.length);
  }
  return null;
}

async function sign(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

function byteLength(value: string | undefined): number {
  return value ? encoder.encode(value).byteLength : 0;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}
