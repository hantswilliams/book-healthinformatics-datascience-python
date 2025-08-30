import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { SupabaseProvider } from "@/lib/SupabaseProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Interactive Coding Platform",
  description: "Interactive Python learning platform for professionals across healthcare, finance, data science, and more",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <SupabaseProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
