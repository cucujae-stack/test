"use client";

/**
 * Like / bookmark / share row on the artwork page. Counts update
 * optimistically in local state; wire to Supabase mutations when auth lands.
 */
import { useState } from "react";
import { Bookmark, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import type { Artwork } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";

export function ActionBar({ artwork }: { artwork: Artwork }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: artwork.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setLiked((v) => !v)}
        aria-pressed={liked}
        className={cn(
          "flex items-center gap-2 border px-4 py-2.5 text-[12px] tracking-[0.1em] uppercase transition-all duration-300",
          liked
            ? "border-accent bg-accent text-canvas"
            : "border-ink/20 hover:border-accent hover:text-accent",
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} strokeWidth={1.5} />
        {formatCount(artwork.likes + (liked ? 1 : 0))}
      </button>
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        className={cn(
          "flex items-center gap-2 border px-4 py-2.5 text-[12px] tracking-[0.1em] uppercase transition-all duration-300",
          saved
            ? "border-accent bg-accent text-canvas"
            : "border-ink/20 hover:border-accent hover:text-accent",
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} strokeWidth={1.5} />
        {formatCount(artwork.bookmarks + (saved ? 1 : 0))}
      </button>
      <button
        type="button"
        onClick={share}
        className="flex items-center gap-2 border border-ink/20 px-4 py-2.5 text-[12px] tracking-[0.1em] uppercase transition-all duration-300 hover:border-accent hover:text-accent"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.5} />
        {copied ? "Copied" : "Share"}
      </button>

      <span className="ml-auto flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
          {formatCount(artwork.views)}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {artwork.commentsCount}
        </span>
      </span>
    </div>
  );
}
