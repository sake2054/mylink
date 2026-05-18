import Image from "next/image";
import { ExternalLink, Link2 } from "lucide-react";

import { StaticLogo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PublicProfileUser = {
  username: string | null;
  displayName: string | null;
  name: string | null;
  bio: string;
  image: string | null;
  links: Array<{
    id: string;
    title: string;
    url: string;
    clickCount: number;
  }>;
};

export function PublicProfile({ user }: { user: PublicProfileUser }) {
  const displayName = user.displayName ?? user.name ?? user.username ?? "MyLink";

  return (
    <main className="min-h-screen bg-background brutal-grid px-5 py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <div className="mb-8">
          <StaticLogo />
        </div>

        <Card className="w-full bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full border-2 border-black object-cover shadow-brutal-sm"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-black bg-secondary text-3xl font-black shadow-brutal-sm">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="mt-5 text-3xl font-black tracking-normal">
                {displayName}
              </h1>
              {user.username ? (
                <Badge variant="accent" className="mt-2">
                  @{user.username}
                </Badge>
              ) : null}
              {user.bio ? (
                <p className="mt-4 max-w-md text-base font-bold leading-7 text-muted-foreground">
                  {user.bio}
                </p>
              ) : null}
            </div>

            <div className="mt-7 space-y-3">
              {user.links.length === 0 ? (
                <div className="rounded-md border-2 border-dashed border-black bg-muted p-6 text-center font-black">
                  No public links yet.
                </div>
              ) : (
                user.links.map((link) => (
                  <a
                    key={link.id}
                    href={`/api/links/${link.id}/click`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "min-h-14 w-full justify-between bg-white px-4"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-black bg-primary">
                        <Link2 className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="truncate">{link.title}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
