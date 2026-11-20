import type { Metadata } from "next";
import Header from "@/components/Header";
import { LINKS } from "@/lib/events";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FaithTech LA", template: "%s · FaithTech LA" },
  description: "Christians in tech, building together in LA. Events, files and ways to connect.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Header />
        {children}
        <footer className="footer">
          <div className="wrap footer-in">
            <p>
              <b>FaithTech LA</b> · The Los Angeles chapter of FaithTech, a global community of Christians in tech.
            </p>
            <p>
              <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a> · <a href={LINKS.laPage}>faithtech.com</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
