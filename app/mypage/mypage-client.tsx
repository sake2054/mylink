"use client";

import * as React from "react";
import Image from "next/image";
import NextLink from "next/link";
import {
  BarChart3,
  Camera,
  Copy,
  Edit3,
  ExternalLink,
  Link2,
  MousePointerClick,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  createLinkAction,
  deleteLinkAction,
  updateProfileImageAction,
  updateLinkAction,
  updateProfileAction
} from "@/app/mypage/actions";
import type { DashboardLink, DashboardProfile } from "@/app/mypage/types";
import { SignOutButton } from "@/components/auth-buttons";
import { Logo } from "@/components/logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { linkSchema, profileSchema } from "@/lib/validations";

type LinkOptimisticAction =
  | { type: "create"; link: DashboardLink }
  | { type: "update"; link: DashboardLink }
  | { type: "delete"; id: string };

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

function truncateLabel(label: string) {
  return label.length > 16 ? `${label.slice(0, 15)}...` : label;
}

export function MyPageClient({
  initialProfile,
  initialLinks,
  publicUrl
}: {
  initialProfile: DashboardProfile;
  initialLinks: DashboardLink[];
  publicUrl: string;
}) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [profileDraft, setProfileDraft] = React.useState(initialProfile);
  const [links, setLinks] = React.useState(initialLinks);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [optimisticProfile, setOptimisticProfile] = React.useOptimistic(
    profile,
    (current, patch: Partial<DashboardProfile>) => ({
      ...current,
      ...patch
    })
  );

  const [optimisticLinks, setOptimisticLinks] = React.useOptimistic(
    links,
    (current, action: LinkOptimisticAction) => {
      if (action.type === "create") {
        return [action.link, ...current];
      }

      if (action.type === "update") {
        return current.map((link) =>
          link.id === action.link.id ? action.link : link
        );
      }

      return current.filter((link) => link.id !== action.id);
    }
  );

  const totalClicks = optimisticLinks.reduce(
    (sum, link) => sum + link.clickCount,
    0
  );

  const chartData = optimisticLinks.map((link) => ({
    name: truncateLabel(link.title),
    clicks: link.clickCount
  }));

  function saveProfile() {
    const parsed = profileSchema.safeParse(profileDraft);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "프로필 값을 확인해 주세요.");
      return;
    }

    const nextProfile = {
      ...profile,
      ...parsed.data
    };

    setError(null);
    setMessage(null);

    startTransition(() => {
      setOptimisticProfile(nextProfile);
      void updateProfileAction(nextProfile)
        .then((updated) => {
          setProfile(updated);
          setProfileDraft(updated);
          setMessage("프로필이 저장되었습니다.");
        })
        .catch((updateError) => {
          setProfileDraft(profile);
          setError(getErrorMessage(updateError));
        });
    });
  }

  function uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    setError(null);
    setMessage(null);

    startTransition(() => {
      void updateProfileImageAction(formData)
        .then((updated) => {
          setProfile(updated);
          setProfileDraft(updated);
          setMessage("프로필 사진이 변경되었습니다.");
        })
        .catch((uploadError) => {
          setError(getErrorMessage(uploadError));
        })
        .finally(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        });
    });
  }

  function createLink(input: Pick<DashboardLink, "title" | "url">) {
    const parsed = linkSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "링크 값을 확인해 주세요.");
    }

    const tempLink: DashboardLink = {
      id: `temp-${crypto.randomUUID()}`,
      title: parsed.data.title,
      url: parsed.data.url,
      icon: "link",
      clickCount: 0
    };

    setError(null);
    setMessage(null);

    startTransition(() => {
      setOptimisticLinks({ type: "create", link: tempLink });
      void createLinkAction(parsed.data)
        .then((created) => {
          setLinks((current) => [created, ...current]);
          setMessage("링크가 추가되었습니다.");
        })
        .catch((createError) => {
          setError(getErrorMessage(createError));
        });
    });
  }

  function updateLink(id: string, input: Pick<DashboardLink, "title" | "url">) {
    const parsed = linkSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "링크 값을 확인해 주세요.");
    }

    const current = optimisticLinks.find((link) => link.id === id);

    if (!current) {
      throw new Error("수정할 링크를 찾을 수 없습니다.");
    }

    const nextLink = {
      ...current,
      ...parsed.data
    };

    setError(null);
    setMessage(null);

    startTransition(() => {
      setOptimisticLinks({ type: "update", link: nextLink });
      void updateLinkAction({ id, ...parsed.data })
        .then((updated) => {
          setLinks((currentLinks) =>
            currentLinks.map((link) => (link.id === id ? updated : link))
          );
          setMessage("링크가 수정되었습니다.");
        })
        .catch((updateError) => {
          setError(getErrorMessage(updateError));
        });
    });
  }

  function deleteLink(id: string) {
    setError(null);
    setMessage(null);

    startTransition(() => {
      setOptimisticLinks({ type: "delete", id });
      void deleteLinkAction(id)
        .then(() => {
          setLinks((current) => current.filter((link) => link.id !== id));
          setMessage("링크가 삭제되었습니다.");
        })
        .catch((deleteError) => {
          setError(getErrorMessage(deleteError));
        });
    });
  }

  function copyPublicUrl() {
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setMessage("공개 URL이 복사되었습니다.");
    });
  }

  return (
    <main className="min-h-screen bg-background brutal-grid">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <NextLink
            href="/"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Public page
          </NextLink>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 pb-12 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-5">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Public profile: root URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                {optimisticProfile.image ? (
                  <Image
                    src={optimisticProfile.image}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full border-2 border-black object-cover shadow-brutal-sm"
                  />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-black bg-secondary text-3xl font-black shadow-brutal-sm">
                    {optimisticProfile.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-2">
                  <Label
                    htmlFor="profileImage"
                    className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Change photo
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        uploadProfileImage(file);
                      }
                    }}
                  />
                  <p className="text-sm font-semibold text-muted-foreground">
                    JPG, PNG, WebP, GIF up to 5MB.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Handle</Label>
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border-2 border-black bg-muted text-sm font-black shadow-brutal-sm">
                    @
                  </span>
                  <Input
                    id="username"
                    value={profileDraft.username}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        username: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={profileDraft.displayName}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      displayName: event.target.value
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileDraft.bio}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      bio: event.target.value
                    }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveProfile} disabled={isPending}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save profile
                </Button>
                <Button variant="outline" onClick={copyPublicUrl}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy URL
                </Button>
              </div>
              <div className="rounded-md border-2 border-black bg-muted p-3 text-sm font-bold">
                {publicUrl}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5" aria-hidden="true" />
                Total clicks
              </CardTitle>
              <CardDescription>All tracked public link clicks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black">{totalClicks}</div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          {(message || error) && (
            <div
              className={cn(
                "rounded-md border-2 border-black p-3 text-sm font-black shadow-brutal-sm",
                error ? "bg-destructive text-destructive-foreground" : "bg-secondary"
              )}
            >
              {error ?? message}
            </div>
          )}

          <Card className="bg-white">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Links</CardTitle>
                <CardDescription>
                  Create, edit, and remove links shown on your public profile.
                </CardDescription>
              </div>
              <CreateLinkDialog onCreate={createLink} />
            </CardHeader>
            <CardContent className="space-y-3">
              {optimisticLinks.length === 0 ? (
                <div className="rounded-md border-2 border-dashed border-black bg-muted p-8 text-center font-black">
                  No links yet.
                </div>
              ) : (
                optimisticLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onUpdate={updateLink}
                    onDelete={deleteLink}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                Click breakdown
              </CardTitle>
              <CardDescription>Clicks per link.</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="rounded-md border-2 border-dashed border-black bg-muted p-8 text-center font-black">
                  Add links to see chart data.
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                    >
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={112}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#111111", fontWeight: 800, fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(17, 17, 17, 0.08)" }}
                        contentStyle={{
                          border: "2px solid #111111",
                          borderRadius: 6,
                          boxShadow: "3px 3px 0 #111111",
                          fontWeight: 800
                        }}
                      />
                      <Bar
                        dataKey="clicks"
                        fill="#21c4d7"
                        stroke="#111111"
                        strokeWidth={2}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function CreateLinkDialog({
  onCreate
}: {
  onCreate: (input: Pick<DashboardLink, "title" | "url">) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  function reset() {
    setTitle("");
    setUrl("");
    setFormError(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      onCreate({ title, url });
      reset();
      setOpen(false);
    } catch (createError) {
      setFormError(getErrorMessage(createError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "secondary" }))}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add link
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a link</DialogTitle>
          <DialogDescription>
            Title and URL are required. URLs must include https://.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Portfolio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-url">URL</Label>
            <Input
              id="new-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </div>
          {formError ? (
            <div className="rounded-md border-2 border-black bg-destructive p-3 text-sm font-black text-destructive-foreground">
              {formError}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkCard({
  link,
  onUpdate,
  onDelete
}: {
  link: DashboardLink;
  onUpdate: (id: string, input: Pick<DashboardLink, "title" | "url">) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({
    title: link.title,
    url: link.url
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setDraft({
        title: link.title,
        url: link.url
      });
    }
  }, [isEditing, link.title, link.url]);

  function submit() {
    try {
      onUpdate(link.id, draft);
      setFormError(null);
      setIsEditing(false);
    } catch (updateError) {
      setFormError(getErrorMessage(updateError));
    }
  }

  return (
    <div className="rounded-md border-2 border-black bg-background p-4 shadow-brutal-sm">
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value
                }))
              }
              aria-label="Link title"
            />
            <Input
              value={draft.url}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  url: event.target.value
                }))
              }
              aria-label="Link URL"
            />
          </div>
          {formError ? (
            <div className="rounded-md border-2 border-black bg-destructive p-2 text-sm font-black text-destructive-foreground">
              {formError}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={submit}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft({ title: link.title, url: link.url });
                setFormError(null);
                setIsEditing(false);
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-black bg-secondary">
                <Link2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-black">{link.title}</h3>
                <p className="truncate text-sm font-semibold text-muted-foreground">
                  {link.url}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="ml-11 w-fit">
              {link.clickCount} clicks
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsEditing(true)}
              title="Edit link"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Edit link</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                className={cn(
                  buttonVariants({ variant: "destructive", size: "icon" })
                )}
                title="Delete link"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete link</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The link and its click history
                    will be permanently removed from SQLite.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(link.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
