import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const updateResourceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  resource_type: z.enum(['link', 'document', 'video', 'tool']).optional(),
  category: z.enum(['learning', 'reference', 'tools', 'documentation', 'external']).optional(),
  icon: z.string().optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
});

async function getAuthorizedUser(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

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
    return { error: 'User profile not found', status: 404 };
  }

  return { user, userWithOrg };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const authResult = await getAuthorizedUser(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userWithOrg } = authResult;

    // Get the resource
    const { data: resource, error: resourceError } = await supabase
      .from('organization_resources')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organization.id)
      .single();

    if (resourceError) {
      if (resourceError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      throw resourceError;
    }

    return NextResponse.json({
      success: true,
      data: resource
    });

  } catch (error) {
    console.error('Get resource error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const authResult = await getAuthorizedUser(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userWithOrg } = authResult;

    // Only organization owners and admins can update resources
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can update resources' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateResourceSchema.parse(body);

    // Update resource
    const { data: updatedResource, error: updateError } = await supabase
      .from('organization_resources')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organization.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully',
      data: updatedResource
    });

  } catch (error) {
    console.error('Update resource error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const authResult = await getAuthorizedUser(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userWithOrg } = authResult;

    // Only organization owners and admins can delete resources
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can delete resources' },
        { status: 403 }
      );
    }

    // Delete resource
    const { error: deleteError } = await supabase
      .from('organization_resources')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organization.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}