import { cookies } from "next/headers";

import { WORKSPACE_COOKIE } from "./cookies";
import { createOpaqueToken, sha256 } from "./crypto";
import { prisma } from "./prisma";

const WORKSPACE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function ensureWorkspace() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (existingToken) {
    const tokenHash = sha256(existingToken);
    const workspace = await prisma.workspace.upsert({
      where: { tokenHash },
      update: {
        lastSeenAt: new Date(),
      },
      create: {
        tokenHash,
      },
    });

    return {
      token: existingToken,
      workspace,
      created: false,
    };
  }

  const token = createOpaqueToken();
  const tokenHash = sha256(token);
  const workspace = await prisma.workspace.create({
    data: {
      tokenHash,
    },
  });

  cookieStore.set(WORKSPACE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: WORKSPACE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return {
    token,
    workspace,
    created: true,
  };
}

export async function requireWorkspace() {
  const ensured = await ensureWorkspace();
  return ensured.workspace;
}

export async function findWorkspaceFromCookie() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (!existingToken) {
    return null;
  }

  return prisma.workspace.findUnique({
    where: {
      tokenHash: sha256(existingToken),
    },
  });
}
