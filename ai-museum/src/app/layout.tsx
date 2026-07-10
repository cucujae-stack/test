import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI Museum — Where AI Art Becomes an Exhibition",
    template: "%s · AI Museum",
  },
  description:
    "An online museum for AI-generated art. Discover, collect and exhibit machine-imagined work in curated exhibitions and immersive rooms.",
  keywords: ["AI art", "museum", "exhibition", "generative art", "gallery"],
  openGraph: {
    title: "AI Museum",
    description: "Where AI Art Becomes an Exhibition.",
    type: "website",
    siteName: "AI Museum",
  },
};

/**
 * Blocking inline script that applies the persisted theme before first paint,
 * so dark-mode visitors never see a light flash.
 */
const themeInit = `(function(){try{var t=localStorage.getItem("ai-museum-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
