import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 brutal-grid">
      <Card className="max-w-md bg-white">
        <CardHeader>
          <CardTitle>페이지를 찾을 수 없습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="font-semibold text-muted-foreground">
            요청한 MyLink 프로필 또는 리소스가 존재하지 않습니다.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            홈으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
