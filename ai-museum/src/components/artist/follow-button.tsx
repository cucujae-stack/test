"use client";

import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";

/** Optimistic follow toggle; wire to the `follows` table with Supabase auth. */
export function FollowButton({ initialFollowers }: { initialFollowers: number }) {
  const [following, setFollowing] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFollowing((v) => !v)}
      aria-pressed={following}
      className={cn(
        "flex items-center gap-2 px-7 py-3 text-[12px] tracking-[0.2em] uppercase transition-all duration-500",
        following
          ? "border border-accent bg-accent text-canvas"
          : "border border-ink/25 hover:border-accent hover:text-accent",
      )}
    >
      {following ? (
        <UserCheck className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <UserPlus className="h-4 w-4" strokeWidth={1.5} />
      )}
      {following ? "Following" : "Follow"} · {formatCount(initialFollowers + (following ? 1 : 0))}
    </button>
  );
}
