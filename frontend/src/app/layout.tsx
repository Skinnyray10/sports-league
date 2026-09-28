import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Sofia_Sans,
  Sofia_Sans_Condensed,
} from "next/font/google";
import "./globals.css";

const sans = Sofia_Sans({
  variable: "--font-tablero-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Sofia_Sans_Condensed({
  variable: "--font-tablero-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-tablero-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Sports League",
    template: "%s · Sports League",
  },
  description:
    "Administra ligas multideporte: equipos, torneos, partidos y tabla de posiciones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
