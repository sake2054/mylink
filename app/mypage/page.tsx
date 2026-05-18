import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { MyPageClient } from "@/app/mypage/mypage-client";
import type { DashboardLink, DashboardProfile } from "@/app/mypage/types";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignUsernameForUser } from "@/lib/username";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/mypage");
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          clickCount: true
        }
      }
    }
  });

  if (!user) {
    redirect("/api/auth/signin?callbackUrl=/mypage");
  }

  if (!user.username) {
    await assignUsernameForUser({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        links: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            url: true,
            icon: true,
            clickCount: true
          }
        }
      }
    });
  }

  if (!user?.username) {
    redirect("/api/auth/signin?callbackUrl=/mypage");
  }

  const displayName = user.displayName ?? user.name ?? user.username;
  const profile: DashboardProfile = {
    username: user.username,
    displayName,
    bio: user.bio,
    image: user.image
  };

  const links: DashboardLink[] = user.links.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    icon: link.icon,
    clickCount: link.clickCount
  }));

  const origin = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  return (
    <MyPageClient
      initialProfile={profile}
      initialLinks={links}
      publicUrl={origin}
    />
  );
}
