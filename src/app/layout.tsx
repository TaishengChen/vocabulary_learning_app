import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vocab Learning",
  description: "Capture vocabulary from images and study with flashcards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
