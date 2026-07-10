import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArtworksByIds, getRoom, getRooms } from "@/lib/data";
import { RoomWalk } from "@/components/rooms/room-walk";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) return { title: "Room not found" };
  return { title: `${room.theme} — ${room.name}`, description: room.description };
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) notFound();

  const [artworks, rooms] = await Promise.all([
    getArtworksByIds(room.artworkIds),
    getRooms(),
  ]);
  const idx = rooms.findIndex((r) => r.slug === room.slug);
  const nextRoom = rooms[(idx + 1) % rooms.length];

  return (
    <div>
      {/* Threshold */}
      <section className="relative flex h-[65vh] min-h-[420px] items-end overflow-hidden">
        <Image src={room.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundColor: room.tint }} />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-black/20 to-black/40" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-14 md:px-8">
          <Link
            href="/rooms"
            className="mb-6 inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            All rooms
          </Link>
          <p className="text-[11px] tracking-[0.4em] uppercase text-white/60">{room.theme}</p>
          <h1 className="mt-3 font-display text-5xl font-light tracking-wide text-white md:text-7xl">
            {room.name}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">{room.description}</p>
        </div>
      </section>

      {/* The walk-through */}
      <RoomWalk artworks={artworks} tint={room.tint} />

      {/* Doorway to the next room */}
      <Link
        href={`/rooms/${nextRoom.slug}`}
        className="group relative block h-64 overflow-hidden border-t border-line"
      >
        <Image
          src={nextRoom.coverUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-[1500ms] group-hover:scale-105"
        />
        <div
          className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-40"
          style={{ backgroundColor: nextRoom.tint }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/70">Continue to</p>
          <p className="mt-2 font-display text-3xl font-light md:text-4xl">
            {nextRoom.theme} — {nextRoom.name} →
          </p>
        </div>
      </Link>
    </div>
  );
}
