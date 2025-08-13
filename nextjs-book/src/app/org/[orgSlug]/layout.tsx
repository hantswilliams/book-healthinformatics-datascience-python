import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  
  // Use service role to check if organization exists (public info)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  // Verify organization exists
  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, slug')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !organization) {
    notFound();
  }

  // Note: We don't check user authentication here since this layout
  // also serves the login page. User authentication is handled by middleware
  // and individual page components.

  return <>{children}</>;
}