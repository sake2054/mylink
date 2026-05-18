import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";

type OgImageProps = {
  params: Promise<{ username: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const alt = "MyLink profile";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image({ params }: OgImageProps) {
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

  const displayName =
    user?.displayName ?? user?.name ?? user?.username ?? "MyLink Profile";
  const handle = user?.username ? `@${user.username}` : "@mylink";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fff7d6",
          color: "#111111",
          border: "16px solid #111111",
          padding: 56,
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 34,
            fontWeight: 900
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "6px solid #111111",
              background: "#fff200",
              boxShadow: "8px 8px 0 #111111"
            }}
          >
            ML
          </div>
          <div>MyLink</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              alignSelf: "flex-start",
              border: "6px solid #111111",
              background: "#21c4d7",
              padding: "10px 18px",
              fontSize: 32,
              fontWeight: 900,
              boxShadow: "8px 8px 0 #111111"
            }}
          >
            {handle}
          </div>
          <div
            style={{
              maxWidth: 900,
              fontSize: 86,
              lineHeight: 0.95,
              fontWeight: 900
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              maxWidth: 820,
              fontSize: 30,
              lineHeight: 1.35,
              fontWeight: 700,
              color: "#333333"
            }}
          >
            {user?.bio || "One profile for every important link."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            fontWeight: 900
          }}
        >
          <div>mylink</div>
          <div
            style={{
              background: "#ff5f8f",
              border: "6px solid #111111",
              padding: "8px 16px"
            }}
          >
            Share my links
          </div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
