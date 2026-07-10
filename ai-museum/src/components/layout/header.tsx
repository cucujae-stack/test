"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Search, Sun, Upload, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { MUSEUM_EASE } from "@/components/motion/motion-primitives";

const NAV = [
  { href: "/gallery", label: "Gallery" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/rooms", label: "Rooms" },
  { href: "/artists", label: "Artists" },
  { href: "/collections", label: "Collections" },
];

export function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeDrawer = () => setOpen(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-canvas/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="AI Museum home">
          <span className="font-display text-xl tracking-[0.18em] md:text-2xl">AI MUSEUM</span>
          <span className="hidden text-[10px] tracking-[0.3em] text-muted uppercase transition-colors group-hover:text-accent lg:inline">
            est. 2026
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[13px] tracking-[0.08em] transition-colors duration-300 hover:text-accent",
                pathname.startsWith(item.href) ? "text-accent" : "text-ink/80",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-full p-2.5 transition-colors hover:bg-line/60"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full p-2.5 transition-colors hover:bg-line/60"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
            ) : (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            )}
          </button>
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 border border-ink/20 px-4 py-2 text-[12px] tracking-[0.12em] uppercase transition-all duration-300 hover:border-accent hover:text-accent md:flex"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
            Exhibit
          </Link>
          <Link
            href="/auth/login"
            className="hidden bg-ink px-4 py-2 text-[12px] tracking-[0.12em] text-canvas uppercase transition-opacity duration-300 hover:opacity-80 md:block"
          >
            Sign in
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-full p-2.5 transition-colors hover:bg-line/60 md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: MUSEUM_EASE }}
            className="overflow-hidden border-b border-line bg-canvas md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className="py-2.5 text-sm tracking-[0.08em] text-ink/85 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-3 border-t border-line pt-4">
                <Link
                  href="/dashboard"
                  onClick={closeDrawer}
                  className="flex-1 border border-ink/20 px-4 py-2.5 text-center text-[12px] tracking-[0.12em] uppercase"
                >
                  Exhibit
                </Link>
                <Link
                  href="/auth/login"
                  onClick={closeDrawer}
                  className="flex-1 bg-ink px-4 py-2.5 text-center text-[12px] tracking-[0.12em] text-canvas uppercase"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
