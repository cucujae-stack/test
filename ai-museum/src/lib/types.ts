/**
 * Domain types shared across the app.
 *
 * These mirror the Supabase schema in /supabase/migrations. The mock data
 * layer (src/lib/data) satisfies the same shapes, so swapping to live
 * Supabase queries requires no component changes.
 */

export type CategorySlug =
  | "landscape"
  | "portrait"
  | "fantasy"
  | "fashion"
  | "architecture"
  | "cyberpunk"
  | "photography"
  | "anime"
  | "minimal"
  | "abstract";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export interface Artist {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  website?: string;
  socials: { platform: string; url: string }[];
  followers: number;
  following: number;
  worksCount: number;
  createdAt: string;
}

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  width: number;
  height: number;
  artistId: string;
  artist: Pick<Artist, "id" | "username" | "displayName" | "avatarUrl">;
  category: CategorySlug;
  tags: string[];
  prompt?: string;
  negativePrompt?: string;
  model: string;
  colorPalette: string[]; // hex values extracted from the piece
  views: number;
  likes: number;
  bookmarks: number;
  commentsCount: number;
  visibility: "public" | "unlisted" | "private";
  featured: boolean;
  createdAt: string;
}

export interface Exhibition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverUrl: string;
  curator: Pick<Artist, "id" | "username" | "displayName" | "avatarUrl"> | null;
  curatedByAI: boolean;
  artworkIds: string[];
  startsAt: string;
  endsAt?: string;
  featured: boolean;
}

export interface Room {
  slug: string;
  name: string;
  theme: string;
  description: string;
  coverUrl: string;
  /** Accent tint applied to the room's immersive backdrop. */
  tint: string;
  artworkIds: string[];
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerId: string;
  owner: Pick<Artist, "id" | "username" | "displayName" | "avatarUrl">;
  isPublic: boolean;
  artworkIds: string[];
  updatedAt: string;
}

export interface ArtComment {
  id: string;
  artworkId: string;
  author: Pick<Artist, "id" | "username" | "displayName" | "avatarUrl">;
  body: string;
  createdAt: string;
}

/** Cursor-paginated result used by the infinite feed. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
