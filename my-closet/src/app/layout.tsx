import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나만의 옷장",
  description: "AI로 옷장을 스마트하게 관리하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
