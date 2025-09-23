import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const reorderResourcesSchema = z.object({
  resources: z.array(z.object({
    id: z.string().uuid(),
    order_index: z.number().int().min(0)
  })).min(1)
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

    // Only organization owners and admins can reorder resources
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can reorder resources' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = reorderResourcesSchema.parse(body);

    // Verify all resources belong to the organization
    const resourceIds = validatedData.resources.map(r => r.id);
    const { data: existingResources, error: verifyError } = await supabase
      .from('organization_resources')
      .select('id')
      .eq('organization_id', userWithOrg.organization.id)
      .in('id', resourceIds);

    if (verifyError) {
      throw verifyError;
    }

    if (existingResources.length !== resourceIds.length) {
      return NextResponse.json(
        { error: 'Some resources do not belong to this organization' },
        { status: 400 }
      );
    }

    // Update each resource's order_index
    const updatePromises = validatedData.resources.map(resource =>
      supabase
        .from('organization_resources')
        .update({
          order_index: resource.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', resource.id)
        .eq('organization_id', userWithOrg.organization.id)
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Resources reordered successfully'
    });

  } catch (error) {
    console.error('Reorder resources error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder resources' },
      { status: 500 }
    );
  }
}