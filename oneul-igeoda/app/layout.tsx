import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘은 이거다",
  description: "오늘 뭐 먹지? 뭐 입지? 그냥 결정해줘!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
