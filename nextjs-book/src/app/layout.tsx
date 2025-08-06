import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { chapters } from "@/data/chapters";
import Providers from "@/lib/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const session = await getServerSession(authOptions);
  const user = session?.user || null;

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <ResponsiveLayout user={user} chapters={chapters}>
            {children}
          </ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
