import { env } from "cloudflare:workers";
import {
  adminSessionCookie,
  clearAdminSessionCookie,
  createAdminSessionToken,
  hasAdminSession,
  isAdminAuthConfigured,
  isSameOriginRequest,
  verifyAdminPassword,
} from "../../../../lib/admin-auth";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!isAdminAuthConfigured(env)) {
    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 503, headers: noStore },
    );
  }
  return Response.json(
    { authenticated: await hasAdminSession(request, env) },
    { headers: noStore },
  );
}

export async function POST(request: Request) {
  if (!isAdminAuthConfigured(env)) {
    return Response.json(
      { error: "Admin authentication is not configured." },
      { status: 503, headers: noStore },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403, headers: noStore },
    );
  }
  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return Response.json(
        { error: "Request is too large." },
        { status: 413, headers: noStore },
      );
    }
    return Response.json(
      { error: "Invalid sign-in request." },
      { status: 400, headers: noStore },
    );
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    body.password.length > 1024 ||
    !(await verifyAdminPassword(body.password, env))
  ) {
    return Response.json(
      { error: "Invalid admin credentials." },
      { status: 401, headers: noStore },
    );
  }

  const token = await createAdminSessionToken(env);
  return Response.json(
    { authenticated: true },
    {
      headers: {
        ...noStore,
        "Set-Cookie": adminSessionCookie(token),
      },
    },
  );
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403, headers: noStore },
    );
  }
  return Response.json(
    { authenticated: false },
    {
      headers: {
        ...noStore,
        "Set-Cookie": clearAdminSessionCookie(),
      },
    },
  );
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > 2048) {
      await reader.cancel();
      throw new RequestTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

class RequestTooLargeError extends Error {}
