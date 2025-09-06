import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './supabase';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper function to get authenticated user with organization
export async function getAuthenticatedUser(orgSlug?: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, organization: null, error: authError };
    }

    // If orgSlug is provided, get user for specific organization
    if (orgSlug) {
      // First get the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();
      
      if (orgError || !org) {
        return { user: null, organization: null, error: orgError };
      }
      
      // Then get the user profile for this organization
      const { data: userWithOrg, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .single();

      if (userError || !userWithOrg) {
        return { user: null, organization: null, error: userError };
      }

      return { 
        user: userWithOrg, 
        organization: userWithOrg.organization,
        error: null 
      };
    } else {
      // Fallback: get first active user profile (for backwards compatibility)
      const { data: userWithOrg, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (userError || !userWithOrg) {
        return { user: null, organization: null, error: userError };
      }

      return { 
        user: userWithOrg, 
        organization: userWithOrg.organization,
        error: null 
      };
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return { user: null, organization: null, error };
  }
}

// Helper function to check organization membership
export async function checkOrganizationAccess(organizationSlug: string, userId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        role,
        is_active,
        organization:organizations!inner(slug, id)
      `)
      .eq('auth_user_id', userId)
      .eq('organization.slug', organizationSlug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { hasAccess: false, role: null, error };
    }

    return { 
      hasAccess: true, 
      role: data.role,
      organizationId: data.organization.id,
      error: null 
    };
  } catch (error) {
    return { hasAccess: false, role: null, error };
  }
}