import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProfile } from "@/components/public-profile";
import {
  getProfileDisplayName,
  getPublicProfileByUsername
} from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";

type PublicProfileProps = {
  params: Promise<{ username: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: PublicProfileProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      displayName: true,
      name: true,
      bio: true
    }
  });

  if (!user) {
    return {
      title: "Profile not found"
    };
  }

  const displayName = getProfileDisplayName(user);
  const description =
    user.bio || `Visit ${displayName}'s MyLink profile and explore their links.`;

  return {
    title: `${displayName} (@${user.username})`,
    description,
    openGraph: {
      title: `${displayName} on MyLink`,
      description,
      type: "profile",
      images: [
        {
          url: `/${user.username}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${displayName} MyLink profile`
        }
      ]
    }
  };
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);

  if (!user?.username) {
    notFound();
  }

  return <PublicProfile user={user} />;
}
