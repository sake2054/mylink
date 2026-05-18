import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ClickRouteContext = {
  params: Promise<{ id: string }>;
};

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function GET(_request: Request, { params }: ClickRouteContext) {
  const { id } = await params;

  try {
    const link = await prisma.link.update({
      where: { id },
      data: {
        clickCount: {
          increment: 1
        }
      },
      select: {
        url: true
      }
    });

    return NextResponse.redirect(link.url, { status: 302 });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    throw error;
  }
}
