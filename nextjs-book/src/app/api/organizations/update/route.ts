import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.enum([
    'GENERAL',
    'HEALTHCARE', 
    'FINANCE',
    'TECHNOLOGY',
    'EDUCATION',
    'MANUFACTURING',
    'GOVERNMENT',
    'NON_PROFIT'
  ])
});

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with organization details
    const { data: userWithOrg, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (userError || !userWithOrg || !userWithOrg.organization) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only organization owners and admins can update organization settings
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can update organization settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // Use the organization data we already have
    const organization = userWithOrg.organization;

    // Generate slug from name if name is being changed
    let slug = organization.slug;
    if (validatedData.name !== organization.name) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if slug exists and make it unique if needed
      let counter = 1;
      slug = baseSlug;
      
      while (true) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existingOrg) break;
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update organization
    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update({
        name: validatedData.name,
        slug,
        description: validatedData.description || null,
        website: validatedData.website || null,
        industry: validatedData.industry,
        updated_at: new Date().toISOString()
      })
      .eq('id', organization.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        slug: updatedOrganization.slug,
        description: updatedOrganization.description,
        website: updatedOrganization.website,
        industry: updatedOrganization.industry
      }
    });

  } catch (error) {
    console.error('Update organization error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}