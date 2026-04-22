import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "safe@home — Aging, migration, and the meaning of home",
  description:
    "Explore how aging immigrants in Norway navigate care, technology, and belonging through an interactive map of stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        style={{
          minHeight: "100%",
          background: "#f9f9f9",
          color: "#2c2c2c",
          fontFamily: '"Oslo Sans", "Helvetica Neue", Arial, sans-serif',
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
