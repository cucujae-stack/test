"use client";

/**
 * Fullscreen viewing room.
 *
 * Keyboard: ← / → move between related works, +/- or scroll zooms,
 * 0 resets zoom, Esc leaves. Double-click toggles 2× zoom; drag pans
 * while zoomed.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import type { Artwork } from "@/lib/types";

interface Props {
  artworks: Artwork[];
  startIndex: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function Lightbox({ artworks, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const artwork = artworks[index];

  const go = useCallback(
    (dir: 1 | -1) => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIndex((i) => (i + dir + artworks.length) % artworks.length);
    },
    [artworks.length],
  );

  const changeZoom = useCallback((delta: number) => {
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta));
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          go(1);
          break;
        case "ArrowLeft":
          go(-1);
          break;
        case "+":
        case "=":
          changeZoom(0.5);
          break;
        case "-":
          changeZoom(-0.5);
          break;
        case "0":
          setZoom(1);
          setOffset({ x: 0, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, changeZoom, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${artwork.title} — fullscreen view`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      onWheel={(e) => changeZoom(e.deltaY < 0 ? 0.25 : -0.25)}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 text-white/80">
        <div className="min-w-0">
          <p className="truncate font-display text-lg">{artwork.title}</p>
          <p className="truncate text-xs text-white/50">
            {artwork.artist.displayName} · {index + 1} / {artworks.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Zoom out"
            onClick={() => changeZoom(-0.5)}
            className="rounded-full p-2.5 transition-colors hover:bg-white/10"
          >
            <Minus className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-white/50">
            {Math.round(zoom * 100)}%
          </span>
          <button
            aria-label="Zoom in"
            onClick={() => changeZoom(0.5)}
            className="rounded-full p-2.5 transition-colors hover:bg-white/10"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            aria-label="Close fullscreen"
            onClick={onClose}
            className="ml-2 rounded-full p-2.5 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6"
        style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
        onDoubleClick={() => {
          setZoom((z) => (z > 1 ? 1 : 2));
          setOffset({ x: 0, y: 0 });
        }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!dragStart.current) return;
          setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
        }}
        onPointerUp={() => {
          dragStart.current = null;
          setDragging(false);
        }}
        onPointerLeave={() => {
          dragStart.current = null;
          setDragging(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.3s ease",
            }}
            className="relative h-full w-full"
          >
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              sizes="100vw"
              className="object-contain select-none"
              draggable={false}
              priority
            />
          </motion.div>
        </AnimatePresence>

        {artworks.length > 1 && (
          <>
            <button
              aria-label="Previous artwork"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button
              aria-label="Next artwork"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      <p className="pb-4 text-center text-[11px] tracking-[0.2em] text-white/35 uppercase">
        ← → navigate · scroll or +/− zoom · double-click 2× · esc to exit
      </p>
    </motion.div>
  );
}
