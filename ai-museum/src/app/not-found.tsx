import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center wall-texture">
      <p className="museum-label">Room 404</p>
      <h1 className="mt-4 font-display text-5xl font-light tracking-wide md:text-7xl">
        This wall is empty
      </h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
        The work you&apos;re looking for has been moved, unhung, or never
        existed. The rest of the museum is still open.
      </p>
      <Link
        href="/"
        className="mt-10 border border-ink/25 px-10 py-4 text-[12px] tracking-[0.3em] uppercase transition-all duration-500 hover:border-accent hover:bg-accent hover:text-canvas"
      >
        Back to the entrance
      </Link>
    </div>
  );
}
