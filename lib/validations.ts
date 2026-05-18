import { z } from "zod";

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "핸들은 3자 이상이어야 합니다.")
    .max(30, "핸들은 30자 이하여야 합니다.")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "핸들은 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
    ),
  displayName: z
    .string()
    .trim()
    .min(1, "표시 이름을 입력해 주세요.")
    .max(60, "표시 이름은 60자 이하여야 합니다."),
  bio: z
    .string()
    .trim()
    .max(160, "소개는 160자 이하여야 합니다.")
});

export const linkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "링크 제목을 입력해 주세요.")
    .max(80, "링크 제목은 80자 이하여야 합니다."),
  url: z
    .string()
    .trim()
    .url("https://example.com 형식의 올바른 URL을 입력해 주세요.")
});

export const updateLinkSchema = linkSchema.extend({
  id: z.string().min(1)
});
