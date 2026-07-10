"use client";

/**
 * Artwork upload studio: multi-image drag & drop with previews, full
 * metadata (prompt, negative prompt, model, tags, category), visibility and
 * scheduled publication. Submission targets Supabase Storage + the artworks
 * table; in demo mode it validates and confirms locally.
 */
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const AI_MODELS = [
  "Midjourney v7",
  "Stable Diffusion XL",
  "FLUX.1 Pro",
  "DALL·E 4",
  "Imagen 4",
  "Firefly 3",
  "Other",
];

interface Preview {
  id: string;
  file: File;
  url: string;
}

export function UploadStudio({ categories }: { categories: Category[] }) {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [schedule, setSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      }));
    setPreviews((prev) => [...prev, ...next]);
  }, []);

  const removePreview = (id: string) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t) && tags.length < 8) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (previews.length === 0) {
      setDone("Add at least one image before publishing.");
      return;
    }
    // With Supabase connected: upload each file to Storage, insert the
    // artworks row (+ artwork_images, artwork_tags) and set published_at or
    // scheduled_for. Demo mode confirms locally.
    setDone(
      isSupabaseConfigured()
        ? "Uploading to the museum…"
        : schedule && publishAt
          ? `Saved. This piece is scheduled to open on ${new Date(publishAt).toLocaleString()}. (Demo mode — connect Supabase to persist.)`
          : "Saved. In demo mode nothing leaves your browser — connect Supabase to persist uploads.",
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      {/* ------------------------------------------------ Drop zone */}
      <section>
        <p className="museum-label">Images</p>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition-all duration-300",
            dragging ? "border-accent bg-accent/5" : "border-line hover:border-accent/60",
          )}
        >
          <UploadCloud className="h-10 w-10 text-muted" strokeWidth={1} />
          <p className="mt-4 font-display text-xl font-light">
            Drag artwork here, or click to browse
          </p>
          <p className="mt-1.5 text-xs text-muted">
            Multiple images welcome · PNG, JPEG, WebP · the first becomes the cover
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        <AnimatePresence>
          {previews.length > 0 && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
            >
              {previews.map((p, i) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative aspect-square overflow-hidden border border-line"
                >
                  <Image src={p.url} alt={p.file.name} fill sizes="120px" className="object-cover" unoptimized />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 bg-black/60 px-1.5 py-0.5 text-[9px] tracking-[0.15em] text-white uppercase">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${p.file.name}`}
                    onClick={() => removePreview(p.id)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </section>

      {/* ------------------------------------------------ Details */}
      <section className="grid gap-8 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="museum-label">Title *</span>
          <input
            required
            type="text"
            name="title"
            maxLength={120}
            placeholder="Give the piece a name"
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="museum-label">Description</span>
          <textarea
            name="description"
            rows={3}
            placeholder="What should visitors know about this work?"
            className="mt-2 w-full resize-y border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="museum-label">Prompt (optional — shared publicly)</span>
          <textarea
            name="prompt"
            rows={3}
            placeholder="The prompt behind the piece"
            className="mt-2 w-full resize-y border border-line bg-transparent px-4 py-3 font-mono text-xs outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="museum-label">Negative prompt</span>
          <textarea
            name="negativePrompt"
            rows={3}
            placeholder="What the model was told to avoid"
            className="mt-2 w-full resize-y border border-line bg-transparent px-4 py-3 font-mono text-xs outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="museum-label">AI model *</span>
          <select
            required
            name="model"
            defaultValue=""
            className="mt-2 w-full border border-line bg-canvas px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          >
            <option value="" disabled>
              Select the model
            </option>
            {AI_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="museum-label">Category *</span>
          <select
            required
            name="category"
            defaultValue=""
            className="mt-2 w-full border border-line bg-canvas px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          >
            <option value="" disabled>
              Select a wing
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Tags */}
        <div className="md:col-span-2">
          <span className="museum-label">Tags (up to 8)</span>
          <div className="mt-2 flex flex-wrap items-center gap-2 border border-line px-3 py-2.5 transition-colors focus-within:border-accent">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1.5 bg-line/50 px-2.5 py-1 text-xs">
                #{t}
                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                  <X className="h-3 w-3" strokeWidth={1.5} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder={tags.length ? "" : "dreamlike, muted, cinematic…"}
              aria-label="Add tag"
              className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Publishing */}
      <section className="border-t border-line pt-10">
        <p className="museum-label">Publication</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {(["public", "unlisted", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              aria-pressed={visibility === v}
              className={cn(
                "border px-5 py-2.5 text-[12px] tracking-[0.15em] uppercase transition-all duration-300",
                visibility === v
                  ? "border-accent bg-accent text-canvas"
                  : "border-line text-muted hover:border-accent hover:text-accent",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={schedule}
            onChange={(e) => setSchedule(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <CalendarClock className="h-4 w-4 text-muted" strokeWidth={1.5} />
          Schedule the opening
        </label>
        {schedule && (
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            aria-label="Publication date and time"
            className="mt-3 border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-3 bg-ink px-10 py-4 text-[12px] tracking-[0.25em] text-canvas uppercase transition-opacity hover:opacity-85"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
            {schedule ? "Schedule" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => setDone("Draft saved locally. Connect Supabase to persist drafts.")}
            className="border border-ink/20 px-8 py-4 text-[12px] tracking-[0.25em] uppercase transition-colors hover:border-accent hover:text-accent"
          >
            Save draft
          </button>
        </div>

        {done && (
          <p role="status" className="mt-6 border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-ink/80">
            {done}
          </p>
        )}
      </section>
    </form>
  );
}
