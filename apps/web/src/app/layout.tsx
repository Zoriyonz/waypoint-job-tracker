import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint: know your odds before you apply",
  description:
    "An application tracker that scores your resume against every job, shows exactly what's missing, and drafts a tailored cover letter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-aurora">{children}</body>
    </html>
  );
}
