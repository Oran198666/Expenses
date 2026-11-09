import type { Metadata } from "next";
import { Exo_2, Orbitron } from "next/font/google";
import "./globals.css";

// Free stand-ins for "Star Sans Pro" (see ADR-3 in spec/ARCHITECTURE.md).
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Personal expense management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${orbitron.variable} ${exo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
