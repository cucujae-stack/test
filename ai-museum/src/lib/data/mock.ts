/**
 * Mock museum content.
 *
 * This dataset powers the entire experience before Supabase is connected.
 * Every shape matches src/lib/types.ts (and therefore the SQL schema), so the
 * data-access functions in src/lib/data/index.ts can be swapped to live
 * queries without touching the UI.
 */
import type {
  Artist,
  ArtComment,
  Artwork,
  Category,
  Collection,
  Exhibition,
  Room,
} from "@/lib/types";

export const CATEGORIES: Category[] = [
  { slug: "landscape", name: "Landscape", description: "Horizons, weather and light — worlds without figures." },
  { slug: "portrait", name: "Portrait", description: "Faces imagined by machines, studied like old masters." },
  { slug: "fantasy", name: "Fantasy", description: "Myth, dream logic and impossible geographies." },
  { slug: "fashion", name: "Fashion", description: "Couture that was never sewn." },
  { slug: "architecture", name: "Architecture", description: "Structures beyond engineering." },
  { slug: "cyberpunk", name: "Cyberpunk", description: "Neon futures and quiet dystopias." },
  { slug: "photography", name: "Photography", description: "Synthetic light that reads as truth." },
  { slug: "anime", name: "Anime", description: "Line, cel and character reimagined." },
  { slug: "minimal", name: "Minimal", description: "Reduction as a discipline." },
  { slug: "abstract", name: "Abstract", description: "Form, colour and nothing else." },
];

const MODELS = [
  "Midjourney v7",
  "Stable Diffusion XL",
  "FLUX.1 Pro",
  "DALL·E 4",
  "Imagen 4",
  "Firefly 3",
];

export const ARTISTS: Artist[] = [
  {
    id: "a1",
    username: "mira-solen",
    displayName: "Mira Solén",
    avatarUrl: "/art/avatar-01.svg",
    bannerUrl: "/art/banner-01.svg",
    bio: "Scandinavian light, latent space. I train models on fog and call it archaeology.",
    website: "https://example.com/mira",
    socials: [
      { platform: "instagram", url: "https://instagram.com/mira.solen" },
      { platform: "x", url: "https://x.com/mirasolen" },
    ],
    followers: 48210,
    following: 312,
    worksCount: 6,
    createdAt: "2024-03-11T09:00:00Z",
  },
  {
    id: "a2",
    username: "kenji-void",
    displayName: "Kenji Void",
    avatarUrl: "/art/avatar-02.svg",
    bannerUrl: "/art/banner-02.svg",
    bio: "Tokyo. Neon minimalist. Every image is one prompt, no edits.",
    socials: [{ platform: "x", url: "https://x.com/kenjivoid" }],
    followers: 39750,
    following: 88,
    worksCount: 6,
    createdAt: "2023-11-02T09:00:00Z",
  },
  {
    id: "a3",
    username: "aurelia",
    displayName: "Aurelia Marchetti",
    avatarUrl: "/art/avatar-03.svg",
    bannerUrl: "/art/banner-03.svg",
    bio: "Former textile designer. Now I weave with diffusion noise instead of silk.",
    website: "https://example.com/aurelia",
    socials: [{ platform: "instagram", url: "https://instagram.com/aurelia.made" }],
    followers: 27430,
    following: 540,
    worksCount: 6,
    createdAt: "2024-06-20T09:00:00Z",
  },
  {
    id: "a4",
    username: "noor-atlas",
    displayName: "Noor Atlas",
    avatarUrl: "/art/avatar-04.svg",
    bannerUrl: "/art/banner-04.svg",
    bio: "Architecture school dropout documenting cities that will never be built.",
    socials: [{ platform: "behance", url: "https://behance.net/nooratlas" }],
    followers: 21980,
    following: 205,
    worksCount: 6,
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "a5",
    username: "elio-frame",
    displayName: "Elio Frame",
    avatarUrl: "/art/avatar-05.svg",
    bannerUrl: "/art/banner-05.svg",
    bio: "Synthetic photography. If it looks like a memory, it worked.",
    socials: [{ platform: "x", url: "https://x.com/elioframe" }],
    followers: 18540,
    following: 671,
    worksCount: 6,
    createdAt: "2023-08-30T09:00:00Z",
  },
  {
    id: "a6",
    username: "vesna",
    displayName: "Vesna K.",
    avatarUrl: "/art/avatar-06.svg",
    bannerUrl: "/art/banner-06.svg",
    bio: "Painting with prompts since 2022. Mostly portraits, mostly melancholy.",
    socials: [],
    followers: 15320,
    following: 129,
    worksCount: 6,
    createdAt: "2024-09-05T09:00:00Z",
  },
];

const TITLES = [
  "Study in Fading Light",
  "The Cartographer's Dream",
  "Silk Meridian",
  "Ninth Hour",
  "Terminal Garden",
  "Vestibule",
  "Salt and Signal",
  "Quiet Machine",
  "Aperture of June",
  "Low Tide Cathedral",
  "Fieldnotes from Nowhere",
  "The Last Pavilion",
  "Chromatic Rest",
  "Hollow Season",
  "Windowlight II",
  "Procession",
  "Analog Ghost",
  "Second Horizon",
  "Meridian Bloom",
  "Still Life with Static",
  "Northern Interior",
  "The Long Corridor",
  "Paper Sky",
  "Monsoon Arcade",
  "Velvet Circuit",
  "Antechamber",
  "Glasshouse Dusk",
  "Cinder Coast",
  "The Patient Garden",
  "Halflight Sonata",
  "Museum of Rain",
  "Idle Engine",
  "Sable Meridian",
  "The Fifth Wall",
  "Orchard of Antennae",
  "Closing Hours",
];

const TAG_POOL = [
  "dreamlike", "muted", "cinematic", "soft-light", "brutalist", "editorial",
  "film-grain", "monochrome", "golden-hour", "fog", "neon", "organic",
  "geometric", "melancholy", "texture", "large-format", "quiet", "surreal",
];

const DESCRIPTIONS = [
  "Part of an ongoing series exploring how diffusion models remember places they have never seen.",
  "A single prompt, thirty-one revisions. The final frame kept the accident.",
  "Commissioned study for a room that exists only in latent space.",
  "The model was asked for silence. This is what it returned.",
  "From a series on synthetic memory and the architecture of forgetting.",
  "An exercise in restraint — everything the prompt allowed was removed except light.",
];

const PALETTE_SETS: string[][] = [
  ["#2b2530", "#5d4a66", "#a98ea1", "#e3cfc3", "#8c6a4a"],
  ["#e8e0d1", "#cbb99a", "#8c6a4a", "#4f4234", "#23201b"],
  ["#12232b", "#2e5359", "#6f9490", "#c3d0c0", "#ede8dc"],
  ["#f0e6dc", "#d9b8a5", "#a5716b", "#5f4351", "#2c2331"],
  ["#0e1016", "#232a3d", "#4a5878", "#8f9bb3", "#d8d3c8"],
  ["#1d1512", "#4f2e22", "#94553a", "#cf9668", "#efe1cd"],
  ["#171c14", "#38452c", "#66754a", "#a3ab7f", "#e6e2ce"],
  ["#e9e7e2", "#c9c6bd", "#a09c92", "#6c6961", "#3a3833"],
];

// Aspect ratios must match scripts/generate-art.mjs ordering.
const RATIOS: [number, number][] = [
  [1200, 1500], [1200, 900], [1200, 1200], [1200, 1700], [1200, 800], [1200, 1400],
];

const CATEGORY_ORDER = CATEGORIES.map((c) => c.slug);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const ARTWORKS: Artwork[] = TITLES.map((title, idx) => {
  const i = idx + 1;
  const artist = ARTISTS[idx % ARTISTS.length];
  const [width, height] = RATIOS[i % RATIOS.length];
  const category = CATEGORY_ORDER[idx % CATEGORY_ORDER.length];
  const tags = [
    TAG_POOL[idx % TAG_POOL.length],
    TAG_POOL[(idx * 5 + 3) % TAG_POOL.length],
    TAG_POOL[(idx * 11 + 7) % TAG_POOL.length],
  ];
  const daysAgo = (idx * 37) % 180;
  return {
    id: `w${i}`,
    slug: slugify(title),
    title,
    description: DESCRIPTIONS[idx % DESCRIPTIONS.length],
    imageUrl: `/art/artwork-${String(i).padStart(2, "0")}.svg`,
    width,
    height,
    artistId: artist.id,
    artist: {
      id: artist.id,
      username: artist.username,
      displayName: artist.displayName,
      avatarUrl: artist.avatarUrl,
    },
    category,
    tags: [...new Set(tags)],
    prompt:
      idx % 3 === 0
        ? undefined
        : `${title.toLowerCase()}, ${tags.join(", ")}, muted palette, large negative space, 35mm, gallery print`,
    negativePrompt: idx % 4 === 0 ? "oversaturated, busy, text, watermark" : undefined,
    model: MODELS[idx % MODELS.length],
    colorPalette: PALETTE_SETS[idx % PALETTE_SETS.length],
    views: 900 + ((idx * 761) % 42000),
    likes: 120 + ((idx * 389) % 8200),
    bookmarks: 40 + ((idx * 173) % 2100),
    commentsCount: 2 + (idx % 14),
    visibility: "public",
    featured: idx % 9 === 0,
    createdAt: new Date(Date.UTC(2026, 6, 9) - daysAgo * 86400000).toISOString(),
  };
});

export const EXHIBITIONS: Exhibition[] = [
  {
    id: "e1",
    slug: "summer-light",
    title: "Summer Light",
    subtitle: "Twelve studies of synthetic sun",
    description:
      "An exhibition on the way machines render warmth. Twelve works trace the arc of a single imagined day, from first light to the hour after closing.",
    coverUrl: "/art/banner-01.svg",
    curator: null,
    curatedByAI: true,
    artworkIds: ARTWORKS.slice(0, 12).map((w) => w.id),
    startsAt: "2026-07-01T00:00:00Z",
    endsAt: "2026-07-31T00:00:00Z",
    featured: true,
  },
  {
    id: "e2",
    slug: "quiet-machines",
    title: "Quiet Machines",
    subtitle: "Minimalism after automation",
    description:
      "Curated by Kenji Void. Works that treat the model as a collaborator in restraint — what remains when a prompt asks for less.",
    coverUrl: "/art/banner-02.svg",
    curator: { id: "a2", username: "kenji-void", displayName: "Kenji Void", avatarUrl: "/art/avatar-02.svg" },
    curatedByAI: false,
    artworkIds: ARTWORKS.filter((w) => ["minimal", "abstract"].includes(w.category)).map((w) => w.id),
    startsAt: "2026-06-14T00:00:00Z",
    featured: false,
  },
  {
    id: "e3",
    slug: "cities-that-never-were",
    title: "Cities That Never Were",
    subtitle: "Speculative architecture",
    description:
      "Noor Atlas assembles facades, atriums and impossible pavilions — an architecture biennale for buildings with no site and no client.",
    coverUrl: "/art/banner-03.svg",
    curator: { id: "a4", username: "noor-atlas", displayName: "Noor Atlas", avatarUrl: "/art/avatar-04.svg" },
    curatedByAI: false,
    artworkIds: ARTWORKS.filter((w) => ["architecture", "cyberpunk"].includes(w.category)).map((w) => w.id),
    startsAt: "2026-05-30T00:00:00Z",
    featured: false,
  },
  {
    id: "e4",
    slug: "the-fabric-room",
    title: "The Fabric Room",
    subtitle: "Fashion without bodies",
    description:
      "Aurelia Marchetti's survey of couture rendered from noise — garments studied as landscape, texture as narrative.",
    coverUrl: "/art/banner-04.svg",
    curator: { id: "a3", username: "aurelia", displayName: "Aurelia Marchetti", avatarUrl: "/art/avatar-03.svg" },
    curatedByAI: false,
    artworkIds: ARTWORKS.filter((w) => ["fashion", "portrait"].includes(w.category)).map((w) => w.id),
    startsAt: "2026-06-25T00:00:00Z",
    featured: false,
  },
  {
    id: "e5",
    slug: "field-recordings",
    title: "Field Recordings",
    subtitle: "Synthetic photography",
    description:
      "Elio Frame collects images that behave like memories: under-exposed, slightly wrong, completely convincing.",
    coverUrl: "/art/banner-05.svg",
    curator: { id: "a5", username: "elio-frame", displayName: "Elio Frame", avatarUrl: "/art/avatar-05.svg" },
    curatedByAI: false,
    artworkIds: ARTWORKS.filter((w) => ["photography", "landscape"].includes(w.category)).map((w) => w.id),
    startsAt: "2026-07-05T00:00:00Z",
    featured: false,
  },
];

export const ROOMS: Room[] = [
  {
    slug: "dreams",
    name: "Dreams",
    theme: "Room 1",
    description: "Slow works for the hour between sleeping and waking.",
    coverUrl: "/art/banner-06.svg",
    tint: "#5d4a66",
    artworkIds: ARTWORKS.filter((w) => ["fantasy", "abstract"].includes(w.category)).map((w) => w.id),
  },
  {
    slug: "nature",
    name: "Nature",
    theme: "Room 2",
    description: "Weather, terrain and light with no human witness.",
    coverUrl: "/art/banner-07.svg",
    tint: "#38452c",
    artworkIds: ARTWORKS.filter((w) => ["landscape", "photography"].includes(w.category)).map((w) => w.id),
  },
  {
    slug: "fashion",
    name: "Fashion",
    theme: "Room 3",
    description: "Couture that was never sewn, worn by no one.",
    coverUrl: "/art/banner-08.svg",
    tint: "#a5716b",
    artworkIds: ARTWORKS.filter((w) => ["fashion", "portrait"].includes(w.category)).map((w) => w.id),
  },
  {
    slug: "cyberpunk",
    name: "Cyberpunk",
    theme: "Room 4",
    description: "Neon futures rendered at closing time.",
    coverUrl: "/art/banner-01.svg",
    tint: "#232a3d",
    artworkIds: ARTWORKS.filter((w) => ["cyberpunk", "anime"].includes(w.category)).map((w) => w.id),
  },
  {
    slug: "minimalism",
    name: "Minimalism",
    theme: "Room 5",
    description: "Reduction as a discipline. Everything else removed.",
    coverUrl: "/art/banner-02.svg",
    tint: "#6c6961",
    artworkIds: ARTWORKS.filter((w) => ["minimal", "architecture"].includes(w.category)).map((w) => w.id),
  },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "c1",
    slug: "favorites",
    name: "Favorites",
    description: "The works I return to.",
    ownerId: "a1",
    owner: { id: "a1", username: "mira-solen", displayName: "Mira Solén", avatarUrl: "/art/avatar-01.svg" },
    isPublic: true,
    artworkIds: ["w2", "w7", "w13", "w21", "w30"],
    updatedAt: "2026-07-06T10:00:00Z",
  },
  {
    id: "c2",
    slug: "inspiration",
    name: "Inspiration",
    description: "Reference board for the next series.",
    ownerId: "a3",
    owner: { id: "a3", username: "aurelia", displayName: "Aurelia Marchetti", avatarUrl: "/art/avatar-03.svg" },
    isPublic: true,
    artworkIds: ["w3", "w9", "w15", "w27"],
    updatedAt: "2026-07-02T10:00:00Z",
  },
  {
    id: "c3",
    slug: "character-design",
    name: "Character Design",
    description: "Faces, silhouettes, attitude.",
    ownerId: "a6",
    owner: { id: "a6", username: "vesna", displayName: "Vesna K.", avatarUrl: "/art/avatar-06.svg" },
    isPublic: true,
    artworkIds: ["w2", "w8", "w14", "w20", "w26", "w32"],
    updatedAt: "2026-06-28T10:00:00Z",
  },
  {
    id: "c4",
    slug: "architecture",
    name: "Architecture",
    description: "Structures worth stealing from.",
    ownerId: "a4",
    owner: { id: "a4", username: "noor-atlas", displayName: "Noor Atlas", avatarUrl: "/art/avatar-04.svg" },
    isPublic: true,
    artworkIds: ["w5", "w15", "w25", "w35"],
    updatedAt: "2026-07-08T10:00:00Z",
  },
];

export const COMMENTS: ArtComment[] = [
  {
    id: "cm1",
    artworkId: "w1",
    author: { id: "a2", username: "kenji-void", displayName: "Kenji Void", avatarUrl: "/art/avatar-02.svg" },
    body: "The restraint in the upper third is doing all the work here. Beautiful.",
    createdAt: "2026-07-07T14:21:00Z",
  },
  {
    id: "cm2",
    artworkId: "w1",
    author: { id: "a5", username: "elio-frame", displayName: "Elio Frame", avatarUrl: "/art/avatar-05.svg" },
    body: "Would love to see this printed large. The grain reads completely analog.",
    createdAt: "2026-07-08T09:02:00Z",
  },
  {
    id: "cm3",
    artworkId: "w2",
    author: { id: "a1", username: "mira-solen", displayName: "Mira Solén", avatarUrl: "/art/avatar-01.svg" },
    body: "That palette. Saving this for the winter series.",
    createdAt: "2026-07-05T18:40:00Z",
  },
];
