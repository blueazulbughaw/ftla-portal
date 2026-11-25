import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Community Hub", template: "%s · Community Hub" },
  description: "Homepages, event pages, attendee hubs and planning tools for communities.",
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
              <b>Community Hub</b> · Homepages, events and attendee hubs for communities.
            </p>
            <p>
              <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
