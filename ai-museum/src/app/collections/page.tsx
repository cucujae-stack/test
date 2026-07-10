import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FolderHeart, Lock } from "lucide-react";
import { getArtworksByIds, getCollections } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";

export const metadata: Metadata = {
  title: "Collections",
  description: "Public collections assembled by museum members.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();
  const previews = await Promise.all(
    collections.map((c) => getArtworksByIds(c.artworkIds.slice(0, 3))),
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label">Member archives</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
        Collections
      </h1>
      <p className="mt-4 max-w-lg text-muted">
        Members save works into private and public collections. These are the
        ones they chose to share.
      </p>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        {collections.map((collection, i) => (
          <Reveal key={collection.id} delay={i * 0.07}>
            <div className="group border border-line p-5 transition-colors duration-500 hover:border-accent md:p-7">
              {/* Triptych preview */}
              <div className="grid grid-cols-3 gap-2">
                {previews[i].map((artwork) => (
                  <Link
                    key={artwork.id}
                    href={`/artwork/${artwork.slug}`}
                    className="relative aspect-square overflow-hidden"
                  >
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      sizes="(max-width: 640px) 33vw, 16vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-display text-2xl transition-colors group-hover:text-accent">
                    <FolderHeart className="h-5 w-5 text-accent" strokeWidth={1.5} />
                    {collection.name}
                    {!collection.isPublic && <Lock className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">{collection.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                <Link
                  href={`/artist/${collection.owner.username}`}
                  className="flex items-center gap-2 transition-colors hover:text-accent"
                >
                  <span className="relative h-6 w-6 overflow-hidden rounded-full">
                    <Image src={collection.owner.avatarUrl} alt="" fill sizes="24px" className="object-cover" />
                  </span>
                  {collection.owner.displayName}
                </Link>
                <span>
                  {collection.artworkIds.length} works · updated {formatDate(collection.updatedAt)}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
