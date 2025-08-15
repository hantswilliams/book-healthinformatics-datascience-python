import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { chapters } from "@/data/chapters";
import { SupabaseProvider } from "@/lib/SupabaseProvider";
import { createClient } from "@/lib/supabase-server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "🐍 Interactive Coding Platform",
  description: "Interactive Python learning platform for professionals across healthcare, finance, data science, and more",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SupabaseProvider>
          <ResponsiveLayout chapters={chapters}>
            {children}
          </ResponsiveLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
