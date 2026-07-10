import type { Metadata } from "next";
import { getRooms } from "@/lib/data";
import { RoomDoors } from "@/components/rooms/room-doors";

export const metadata: Metadata = {
  title: "Museum Rooms",
  description: "Enter the themed rooms of the AI Museum.",
};

export default async function RoomsPage() {
  const rooms = await getRooms();

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="museum-label">Floor plan</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
          Museum Rooms
        </h1>
        <p className="mt-4 max-w-lg text-muted">
          Five permanent rooms, each hung around a single idea. Step through a
          doorway and take your time.
        </p>
      </div>

      <RoomDoors rooms={rooms} />
    </div>
  );
}
