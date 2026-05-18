"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import type { DashboardLink, DashboardProfile } from "@/app/mypage/types";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkSchema, profileSchema, updateLinkSchema } from "@/lib/validations";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const maxProfileImageSize = 5 * 1024 * 1024;
const profileImageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

async function requireUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  return session.user.id;
}

function toDashboardLink(link: DashboardLink): DashboardLink {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    icon: link.icon,
    clickCount: link.clickCount
  };
}

async function revalidateUserPages(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  revalidatePath("/");
  revalidatePath("/mypage");

  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function revalidateProfilePaths(usernames: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/mypage");

  for (const username of usernames) {
    if (username) {
      revalidatePath(`/${username}`);
    }
  }
}

async function deleteLocalProfileImage(image: string | null | undefined) {
  if (!image?.startsWith("/uploads/")) {
    return;
  }

  const imagePath = path.join(process.cwd(), "public", image);

  if (!imagePath.startsWith(uploadDir)) {
    return;
  }

  await unlink(imagePath).catch(() => undefined);
}

export async function updateProfileAction(
  input: DashboardProfile
): Promise<DashboardProfile> {
  const userId = await requireUserId();
  const parsed = profileSchema.parse(input);

  const previousUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  const user = await prisma.user
    .update({
      where: { id: userId },
      data: {
        username: parsed.username,
        displayName: parsed.displayName,
        bio: parsed.bio
      },
      select: {
        username: true,
        displayName: true,
        bio: true,
        image: true
      }
    })
    .catch((error) => {
      if (isUniqueConstraintError(error)) {
        throw new Error("이미 사용 중인 핸들입니다.");
      }

      throw error;
    });

  await revalidateProfilePaths([previousUser?.username, user.username]);

  return {
    username: user.username ?? input.username,
    displayName: user.displayName ?? parsed.displayName,
    bio: user.bio,
    image: user.image
  };
}

export async function updateProfileImageAction(
  formData: FormData
): Promise<DashboardProfile> {
  const userId = await requireUserId();
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    throw new Error("업로드할 프로필 사진을 선택해 주세요.");
  }

  if (value.size > maxProfileImageSize) {
    throw new Error("프로필 사진은 5MB 이하만 업로드할 수 있습니다.");
  }

  const extension = profileImageExtensions[value.type];

  if (!extension) {
    throw new Error("프로필 사진은 JPG, PNG, WebP, GIF 형식만 지원합니다.");
  }

  const previousUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      displayName: true,
      bio: true,
      image: true
    }
  });

  if (!previousUser?.username) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  await mkdir(uploadDir, { recursive: true });

  const fileName = `profile-${userId}-${randomUUID()}.${extension}`;
  const publicPath = `/uploads/${fileName}`;
  const filePath = path.join(uploadDir, fileName);
  const bytes = Buffer.from(await value.arrayBuffer());

  await writeFile(filePath, bytes);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { image: publicPath },
    select: {
      username: true,
      displayName: true,
      bio: true,
      image: true
    }
  });

  await deleteLocalProfileImage(previousUser.image);
  await revalidateProfilePaths([user.username]);

  return {
    username: user.username ?? previousUser.username,
    displayName: user.displayName ?? previousUser.displayName ?? previousUser.username,
    bio: user.bio,
    image: user.image
  };
}

export async function createLinkAction(
  input: Pick<DashboardLink, "title" | "url">
): Promise<DashboardLink> {
  const userId = await requireUserId();
  const parsed = linkSchema.parse(input);

  const link = await prisma.link.create({
    data: {
      userId,
      title: parsed.title,
      url: parsed.url
    },
    select: {
      id: true,
      title: true,
      url: true,
      icon: true,
      clickCount: true
    }
  });

  await revalidateUserPages(userId);

  return toDashboardLink(link);
}

export async function updateLinkAction(input: {
  id: string;
  title: string;
  url: string;
}): Promise<DashboardLink> {
  const userId = await requireUserId();
  const parsed = updateLinkSchema.parse(input);

  const existing = await prisma.link.findFirst({
    where: {
      id: parsed.id,
      userId
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    throw new Error("수정할 링크를 찾을 수 없습니다.");
  }

  const link = await prisma.link.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title,
      url: parsed.url
    },
    select: {
      id: true,
      title: true,
      url: true,
      icon: true,
      clickCount: true
    }
  });

  await revalidateUserPages(userId);

  return toDashboardLink(link);
}

export async function deleteLinkAction(id: string) {
  const userId = await requireUserId();

  const result = await prisma.link.deleteMany({
    where: {
      id,
      userId
    }
  });

  if (result.count === 0) {
    throw new Error("삭제할 링크를 찾을 수 없습니다.");
  }

  await revalidateUserPages(userId);

  return { ok: true };
}
