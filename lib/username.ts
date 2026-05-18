import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function normalizeUsernameSeed(seed: string) {
  const normalized = seed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return normalized || "mylink";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function assignUsernameForUser({
  userId,
  email,
  name
}: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (existing?.username) {
    return existing.username;
  }

  const emailPrefix = email?.split("@")[0] ?? name ?? "mylink";
  const base = normalizeUsernameSeed(emailPrefix);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          username: candidate,
          displayName: name || candidate
        },
        select: { username: true }
      });

      if (updated.username) {
        return updated.username;
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  const fallback = `${base}-${userId.slice(0, 6)}`;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      username: fallback,
      displayName: name || fallback
    },
    select: { username: true }
  });

  return updated.username ?? fallback;
}
