import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimiliaScribe — Voice-to-Case AI Scribe | Homeologic",
  description:
    "Prototype: turns a recorded doctor-patient consultation into structured case notes and a repertorial diagnosis suggestion, powered by local Whisper + MedGemma.",
  icons: { icon: "/brand/favicon32.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
