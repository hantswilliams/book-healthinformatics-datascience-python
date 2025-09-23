import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { SupabaseProvider } from "@/lib/SupabaseProvider";
import { BooksProvider } from "@/lib/useBooksData";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Interactive Coding Platform",
  description: "Interactive coding learning platform for professionals across healthcare, finance, data science, and more",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white`} suppressHydrationWarning={true}>
        <SupabaseProvider>
          <BooksProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </BooksProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
