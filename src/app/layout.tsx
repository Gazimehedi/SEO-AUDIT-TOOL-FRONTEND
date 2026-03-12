import type { Metadata } from "next";
import "./globals.css";
import NextAuthProvider from "@/providers/NextAuthProvider";

export const metadata: Metadata = {
  title: {
    default: "SEO Pro — Ultimate SEO Checker",
    template: "%s | SEO Pro",
  },
  description: "Audit any website's technical SEO, performance, broken links, and more in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
