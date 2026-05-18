import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProfile } from "@/components/public-profile";
import {
  getProfileDisplayName,
  getSiteOwnerMetadata,
  getSiteOwnerProfile
} from "@/lib/public-profile";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getSiteOwnerMetadata();

  if (!user) {
    return {
      title: "Profile not found"
    };
  }

  const displayName = getProfileDisplayName(user);
  const description =
    user.bio || `Visit ${displayName}'s MyLink profile and explore their links.`;

  return {
    title: displayName,
    description,
    openGraph: {
      title: `${displayName} on MyLink`,
      description,
      type: "profile",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${displayName} MyLink profile`
        }
      ]
    }
  };
}

export default async function HomePage() {
  const user = await getSiteOwnerProfile();

  if (!user) {
    notFound();
  }

  return <PublicProfile user={user} />;
}
