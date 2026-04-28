import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Unifique Business Platform",
  description: "Plataforma de Negócios TIC · CRM & IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <body className="bg-unifique-bg text-unifique-dark min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
