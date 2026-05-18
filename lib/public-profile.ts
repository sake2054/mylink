import { prisma } from "@/lib/prisma";

export async function getSiteOwnerProfile() {
  return prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          url: true,
          clickCount: true
        }
      }
    }
  });
}

export async function getPublicProfileByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          url: true,
          clickCount: true
        }
      }
    }
  });
}

export async function getSiteOwnerMetadata() {
  return prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      username: true,
      displayName: true,
      name: true,
      bio: true
    }
  });
}

export function getProfileDisplayName(user: {
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
}) {
  return user.displayName ?? user.name ?? user.username ?? "MyLink";
}
