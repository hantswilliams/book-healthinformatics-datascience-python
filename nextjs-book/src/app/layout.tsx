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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Transform Supabase user to match existing user interface
  const userForLayout = user ? {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    firstName: user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.last_name || '',
    role: user.app_metadata?.role || 'LEARNER',
    organizationId: user.app_metadata?.organization_id || '',
    organizationSlug: user.app_metadata?.organization_slug || '',
    organizationName: user.app_metadata?.organization_name || '',
  } : null;

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SupabaseProvider>
          <ResponsiveLayout user={userForLayout} chapters={chapters}>
            {children}
          </ResponsiveLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
