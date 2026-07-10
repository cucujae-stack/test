import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Museum",
    links: [
      { href: "/gallery", label: "Gallery" },
      { href: "/exhibitions", label: "Exhibitions" },
      { href: "/rooms", label: "Rooms" },
      { href: "/collections", label: "Collections" },
    ],
  },
  {
    heading: "Community",
    links: [
      { href: "/artists", label: "Artists" },
      { href: "/search", label: "Search" },
      { href: "/dashboard", label: "Exhibit your work" },
      { href: "/auth/signup", label: "Become a member" },
    ],
  },
  {
    heading: "Institution",
    links: [
      { href: "/about", label: "About" },
      { href: "/admin", label: "Administration" },
      { href: "/about#press", label: "Press" },
      { href: "/about#contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl tracking-[0.18em]">AI MUSEUM</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Where AI art becomes an exhibition. A permanent collection of
              machine-imagined work, open every hour of every day.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="museum-label">{col.heading}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink/75 transition-colors duration-300 hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-xs text-muted md:flex-row md:items-center">
          <p>© 2026 AI Museum. All works belong to their creators.</p>
          <p className="tracking-[0.2em] uppercase">Open 24 hours · Admission free</p>
        </div>
      </div>
    </footer>
  );
}
