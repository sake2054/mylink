import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-black", className)}
      aria-label="MyLink home"
    >
      <span className="grid h-10 w-10 place-items-center rounded-md border-2 border-black bg-primary text-base shadow-brutal-sm">
        ML
      </span>
      <span className="text-xl">MyLink</span>
    </Link>
  );
}

export function StaticLogo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 font-black", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-md border-2 border-black bg-primary text-base shadow-brutal-sm">
        ML
      </span>
      <span className="text-xl">MyLink</span>
    </div>
  );
}
