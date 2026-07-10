import Link from "next/link";
import { cn } from "@/lib/utils";

export type ProfileTab = "works" | "collections" | "exhibitions" | "liked" | "saved";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "works", label: "Works" },
  { key: "collections", label: "Collections" },
  { key: "exhibitions", label: "Exhibitions" },
  { key: "liked", label: "Liked" },
  { key: "saved", label: "Saved" },
];

export function ProfileTabs({ username, active }: { username: string; active: ProfileTab }) {
  return (
    <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/artist/${username}?tab=${t.key}`}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-5 py-3.5 text-[12px] tracking-[0.15em] uppercase transition-colors duration-300",
            active === t.key
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
