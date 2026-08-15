import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PC110 Web",
  description: "PC110 emulator running locally in your browser."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
