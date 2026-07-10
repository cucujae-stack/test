import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Flag,
  ImageIcon,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { getArtists, getArtworks, getExhibitions } from "@/lib/data";
import { formatCount } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Museum administration: users, artworks, reports, analytics.",
};

/**
 * Admin overview. Access control belongs to Supabase RLS (profiles.role =
 * 'admin' + the is_admin() policy helper); this page renders the console
 * with mock data until then.
 */
export default async function AdminPage() {
  const [artists, artworks, exhibitions] = await Promise.all([
    getArtists(),
    getArtworks(),
    getExhibitions(),
  ]);

  const totalViews = artworks.reduce((sum, w) => sum + w.views, 0);
  const totalLikes = artworks.reduce((sum, w) => sum + w.likes, 0);

  const mockReports = [
    { id: "r1", target: "Artwork — “Velvet Circuit”", reason: "Possible duplicate upload", status: "open" },
    { id: "r2", target: "Comment on “Ninth Hour”", reason: "Spam link", status: "reviewing" },
    { id: "r3", target: "Profile — @unknown-artist", reason: "Impersonation claim", status: "open" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
        Administration
      </p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
        Museum Office
      </h1>
      <p className="mt-4 max-w-lg text-sm text-muted">
        Users, artworks, reports and analytics. In production this route is
        gated by the <code className="text-accent">admin</code> role via Supabase RLS.
      </p>

      {/* Analytics */}
      <Reveal className="mt-12 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {[
          { icon: Users, label: "Members", value: formatCount(artists.length * 2140) },
          { icon: ImageIcon, label: "Artworks", value: formatCount(artworks.length * 214) },
          { icon: BarChart3, label: "Views (30d)", value: formatCount(totalViews) },
          { icon: Star, label: "Likes (30d)", value: formatCount(totalLikes) },
        ].map((stat) => (
          <div key={stat.label} className="bg-canvas p-7">
            <stat.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <p className="mt-4 font-display text-4xl font-light">{stat.value}</p>
            <p className="museum-label mt-1.5">{stat.label}</p>
          </div>
        ))}
      </Reveal>

      <div className="mt-14 grid gap-14 lg:grid-cols-2">
        {/* Reports queue */}
        <Reveal>
          <h2 className="flex items-center gap-2.5 font-display text-2xl font-light">
            <Flag className="h-5 w-5 text-accent" strokeWidth={1.5} />
            Moderation queue
          </h2>
          <ul className="mt-6 divide-y divide-line border border-line">
            {mockReports.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm">{report.target}</p>
                  <p className="mt-1 text-xs text-muted">{report.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="border border-accent/40 px-2.5 py-1 text-[10px] tracking-[0.15em] text-accent uppercase">
                    {report.status}
                  </span>
                  <button className="border border-line px-3 py-1 text-[10px] tracking-[0.15em] uppercase text-muted transition-colors hover:border-accent hover:text-accent">
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Feature controls */}
        <Reveal delay={0.1}>
          <h2 className="flex items-center gap-2.5 font-display text-2xl font-light">
            <Star className="h-5 w-5 text-accent" strokeWidth={1.5} />
            Feature on the front wall
          </h2>
          <ul className="mt-6 divide-y divide-line border border-line">
            {artworks.slice(0, 3).map((artwork) => (
              <li key={artwork.id} className="flex items-center gap-4 p-4">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden">
                  <Image src={artwork.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/artwork/${artwork.slug}`} className="block truncate text-sm hover:text-accent">
                    {artwork.title}
                  </Link>
                  <p className="text-xs text-muted">{artwork.artist.displayName}</p>
                </div>
                <button className="shrink-0 border border-line px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase text-muted transition-colors hover:border-accent hover:text-accent">
                  {artwork.featured ? "Unfeature" : "Feature"}
                </button>
              </li>
            ))}
            {exhibitions.slice(0, 2).map((ex) => (
              <li key={ex.id} className="flex items-center gap-4 p-4">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden">
                  <Image src={ex.coverUrl} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/exhibitions/${ex.slug}`} className="block truncate text-sm hover:text-accent">
                    {ex.title} <span className="text-xs text-muted">(exhibition)</span>
                  </Link>
                  <p className="text-xs text-muted">
                    {ex.curatedByAI ? "Curated by AI" : ex.curator?.displayName}
                  </p>
                </div>
                <button className="shrink-0 border border-line px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase text-muted transition-colors hover:border-accent hover:text-accent">
                  {ex.featured ? "Unfeature" : "Feature"}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* User management */}
        <Reveal className="lg:col-span-2">
          <h2 className="flex items-center gap-2.5 font-display text-2xl font-light">
            <Users className="h-5 w-5 text-accent" strokeWidth={1.5} />
            Members
          </h2>
          <div className="mt-6 overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="museum-label p-4 font-normal">Member</th>
                  <th className="museum-label p-4 font-normal">Works</th>
                  <th className="museum-label p-4 font-normal">Followers</th>
                  <th className="museum-label p-4 font-normal">Role</th>
                  <th className="museum-label p-4 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {artists.map((artist) => (
                  <tr key={artist.id}>
                    <td className="p-4">
                      <Link href={`/artist/${artist.username}`} className="flex items-center gap-3 hover:text-accent">
                        <span className="relative h-8 w-8 overflow-hidden rounded-full">
                          <Image src={artist.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
                        </span>
                        {artist.displayName}
                      </Link>
                    </td>
                    <td className="p-4 text-muted">{artist.worksCount}</td>
                    <td className="p-4 text-muted">{formatCount(artist.followers)}</td>
                    <td className="p-4">
                      <span className="border border-line px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-muted">
                        creator
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-[11px] tracking-[0.1em] uppercase text-muted transition-colors hover:text-accent">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
