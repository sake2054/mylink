import path from "node:path";

function hostFromUrl(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
  }
}

const allowedServerActionOrigins = Array.from(
  new Set(
    [
      hostFromUrl(process.env.NEXTAUTH_URL),
      hostFromUrl(process.env.NEXT_PUBLIC_SITE_URL),
      "localhost:3000"
    ].filter(Boolean)
  )
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(),
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      allowedOrigins: allowedServerActionOrigins,
      bodySizeLimit: "6mb"
    }
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com"
      }
    ]
  }
};

export default nextConfig;
