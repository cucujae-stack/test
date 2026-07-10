import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getArtwork, getComments, getRelatedArtworks } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { ArtworkViewer } from "@/components/artwork/artwork-viewer";
import { ActionBar } from "@/components/artwork/action-bar";
import { MasonryGrid } from "@/components/artwork/masonry-grid";
import { Reveal } from "@/components/motion/motion-primitives";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artwork = await getArtwork(id);
  if (!artwork) return { title: "Artwork not found" };
  return {
    title: `${artwork.title} — ${artwork.artist.displayName}`,
    description: artwork.description,
    openGraph: { images: [{ url: artwork.imageUrl }] },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const { id } = await params;
  const artwork = await getArtwork(id);
  if (!artwork) notFound();

  const [related, comments] = await Promise.all([
    getRelatedArtworks(artwork, 8),
    getComments(artwork.id),
  ]);

  return (
    <div className="pt-16 md:pt-20">
      {/* Viewing wall */}
      <div className="border-b border-line bg-surface-raised wall-texture">
        <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-16">
          <ArtworkViewer artwork={artwork} related={related} />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-14 md:px-8 lg:grid-cols-[2fr_1fr] lg:gap-20">
        {/* Main column */}
        <div>
          <Reveal>
            <Link
              href={`/artist/${artwork.artist.username}`}
              className="group flex items-center gap-3"
            >
              <span className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-line">
                <Image
                  src={artwork.artist.avatarUrl}
                  alt={artwork.artist.displayName}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
              <span>
                <span className="block text-sm transition-colors group-hover:text-accent">
                  {artwork.artist.displayName}
                </span>
                <span className="block text-xs text-muted">@{artwork.artist.username}</span>
              </span>
            </Link>

            <h1 className="mt-8 font-display text-4xl font-light tracking-wide md:text-5xl">
              {artwork.title}
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-ink/80">{artwork.description}</p>

            <div className="mt-8">
              <ActionBar artwork={artwork} />
            </div>
          </Reveal>

          {artwork.prompt && (
            <Reveal className="mt-12">
              <p className="museum-label flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                Prompt
              </p>
              <blockquote className="mt-4 border-l-2 border-accent/40 bg-surface-raised p-5 font-mono text-[13px] leading-relaxed text-ink/75">
                {artwork.prompt}
              </blockquote>
              {artwork.negativePrompt && (
                <p className="mt-3 text-xs text-muted">
                  <span className="tracking-[0.15em] uppercase">Negative:</span>{" "}
                  {artwork.negativePrompt}
                </p>
              )}
            </Reveal>
          )}

          {/* Comments */}
          <Reveal className="mt-14 border-t border-line pt-10">
            <p className="museum-label">Visitor remarks · {artwork.commentsCount}</p>
            <ul className="mt-6 space-y-6">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3.5">
                  <span className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                    <Image src={c.author.avatarUrl} alt={c.author.displayName} fill sizes="36px" className="object-cover" />
                  </span>
                  <div>
                    <p className="text-xs text-muted">
                      <Link href={`/artist/${c.author.username}`} className="text-ink/85 hover:text-accent">
                        {c.author.displayName}
                      </Link>{" "}
                      · {formatDate(c.createdAt)}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{c.body}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-muted">No remarks yet — the room is quiet.</li>
              )}
            </ul>
            <form className="mt-8 flex gap-3" action="/auth/login">
              <input
                type="text"
                placeholder="Leave a remark… (sign in required)"
                aria-label="Comment"
                className="flex-1 border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
              />
              <button className="bg-ink px-6 py-3 text-[12px] tracking-[0.15em] text-canvas uppercase transition-opacity hover:opacity-80">
                Post
              </button>
            </form>
          </Reveal>
        </div>

        {/* Wall label sidebar */}
        <Reveal delay={0.1}>
          <aside className="h-max space-y-8 border border-line bg-surface-raised p-7 lg:sticky lg:top-28">
            <div>
              <p className="museum-label">Details</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Model</dt>
                  <dd className="text-right">{artwork.model}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Created</dt>
                  <dd className="text-right">{formatDate(artwork.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Category</dt>
                  <dd className="text-right capitalize">
                    <Link href={`/categories/${artwork.category}`} className="hover:text-accent">
                      {artwork.category}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <p className="museum-label">Color palette</p>
              <div className="mt-4 flex overflow-hidden rounded-sm ring-1 ring-line">
                {artwork.colorPalette.map((hex) => (
                  <span
                    key={hex}
                    title={hex}
                    className="h-10 flex-1"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <p className="mt-2 font-mono text-[10px] text-muted">
                {artwork.colorPalette.join(" · ")}
              </p>
            </div>

            <div>
              <p className="museum-label">Tags</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {artwork.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </Reveal>
      </div>

      {/* Related works */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl border-t border-line px-5 py-16 md:px-8 md:py-24">
          <Reveal>
            <p className="museum-label">In the same room</p>
            <h2 className="mt-3 mb-10 font-display text-3xl font-light md:text-4xl">Related Works</h2>
          </Reveal>
          <MasonryGrid artworks={related.slice(0, 6)} />
        </section>
      )}
    </div>
  );
}
