import type React from "react";
import type { Metadata } from "next";
import { Geist_Mono as GeistMono } from "next/font/google";
import "./globals.css";

const geistMono = GeistMono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HealthOps",
  description: "Insights for great family health",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistMono.className} bg-black text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
