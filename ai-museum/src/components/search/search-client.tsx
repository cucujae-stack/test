"use client";

/**
 * Instant search across artworks, artists, prompts, tags, models, styles and
 * palette colours, with sort by date or popularity.
 */
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { Artist, Artwork, Category } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { MasonryGrid } from "@/components/artwork/masonry-grid";

type Sort = "newest" | "popular" | "views";

/** Rough hex → hue-family match so "blue"/"warm" searches hit palettes. */
const COLOR_WORDS: Record<string, (h: number, s: number, l: number) => boolean> = {
  red: (h, s) => s > 0.15 && (h < 20 || h > 345),
  orange: (h, s) => s > 0.15 && h >= 20 && h < 45,
  gold: (h, s) => s > 0.15 && h >= 35 && h < 55,
  yellow: (h, s) => s > 0.15 && h >= 45 && h < 70,
  green: (h, s) => s > 0.12 && h >= 70 && h < 165,
  teal: (h, s) => s > 0.12 && h >= 160 && h < 200,
  blue: (h, s) => s > 0.12 && h >= 200 && h < 255,
  purple: (h, s) => s > 0.12 && h >= 255 && h < 300,
  pink: (h, s) => s > 0.12 && h >= 300 && h <= 345,
  dark: (_h, _s, l) => l < 0.25,
  light: (_h, _s, l) => l > 0.8,
  warm: (h, s) => s > 0.1 && (h < 70 || h > 330),
  cool: (h, s) => s > 0.1 && h >= 160 && h < 300,
};

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return [(h + 360) % 360, s, l];
}

function matchesColor(artwork: Artwork, word: string): boolean {
  const test = COLOR_WORDS[word];
  if (!test) return false;
  return artwork.colorPalette.some((hex) => test(...hexToHsl(hex)));
}

export function SearchClient({
  initialQuery,
  artworks,
  artists,
  categories,
}: {
  initialQuery: string;
  artworks: Artwork[];
  artists: Artist[];
  categories: Category[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("popular");
  const [category, setCategory] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const artistHits = useMemo(() => {
    if (!q) return [];
    return artists
      .filter(
        (a) =>
          a.displayName.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.bio.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [q, artists]);

  const artworkHits = useMemo(() => {
    let out = artworks;
    if (category) out = out.filter((w) => w.category === category);
    if (q) {
      out = out.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          (w.prompt ?? "").toLowerCase().includes(q) ||
          w.model.toLowerCase().includes(q) ||
          w.category.includes(q) ||
          w.artist.displayName.toLowerCase().includes(q) ||
          w.tags.some((t) => t.includes(q)) ||
          w.colorPalette.some((c) => c.toLowerCase().includes(q)) ||
          matchesColor(w, q),
      );
    }
    switch (sort) {
      case "popular":
        return [...out].sort((a, b) => b.likes - a.likes);
      case "views":
        return [...out].sort((a, b) => b.views - a.views);
      default:
        return [...out].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
  }, [q, sort, category, artworks]);

  return (
    <div>
      {/* Search field */}
      <div className="mt-10 flex items-center gap-4 border-b-2 border-ink/20 pb-4 transition-colors focus-within:border-accent">
        <SearchIcon className="h-6 w-6 text-muted" strokeWidth={1.5} />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artist, artwork, prompt, tag, model, colour, style…"
          aria-label="Search the museum"
          className="w-full bg-transparent font-display text-2xl font-light outline-none placeholder:text-muted/50 md:text-3xl"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["popular", "newest", "views"] as Sort[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "px-3.5 py-1.5 text-[11px] tracking-[0.15em] uppercase transition-colors",
              sort === s ? "bg-ink text-canvas" : "text-muted hover:text-accent",
            )}
          >
            {s === "views" ? "Most viewed" : s}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-line" />
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "px-3 py-1.5 text-[11px] tracking-[0.1em] transition-colors",
            category === null ? "bg-ink text-canvas" : "text-muted hover:text-accent",
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory((cur) => (cur === c.slug ? null : c.slug))}
            className={cn(
              "px-3 py-1.5 text-[11px] tracking-[0.1em] transition-colors",
              category === c.slug ? "bg-ink text-canvas" : "text-muted hover:text-accent",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Artist results */}
      {artistHits.length > 0 && (
        <section className="mt-12">
          <p className="museum-label">Artists</p>
          <div className="mt-5 flex flex-wrap gap-4">
            {artistHits.map((a) => (
              <Link
                key={a.id}
                href={`/artist/${a.username}`}
                className="flex items-center gap-3 border border-line px-4 py-3 transition-colors hover:border-accent"
              >
                <span className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image src={a.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span>
                  <span className="block text-sm">{a.displayName}</span>
                  <span className="block text-xs text-muted">
                    {formatCount(a.followers)} followers
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Artwork results */}
      <section className="mt-12">
        <p className="museum-label">
          {q || category ? `${artworkHits.length} works` : "Browse everything"}
        </p>
        <div className="mt-6">
          {artworkHits.length > 0 ? (
            <MasonryGrid artworks={artworkHits} />
          ) : (
            <p className="py-20 text-center text-muted">
              Nothing on these walls matches “{query}”. Try an artist, tag,
              model or a colour like “warm” or “blue”.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
