import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const createResourceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  url: z.string().url(),
  resource_type: z.enum(['link', 'document', 'video', 'tool']).default('link'),
  category: z.enum(['learning', 'reference', 'tools', 'documentation', 'external']).default('learning'),
  icon: z.string().optional(),
  order_index: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('active');

    // Build query
    let query = supabase
      .from('organization_resources')
      .select('*')
      .eq('organization_id', userWithOrg.organization.id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: resources, error: resourcesError } = await query;

    if (resourcesError) {
      throw resourcesError;
    }

    return NextResponse.json({
      success: true,
      data: resources || []
    });

  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Only organization owners and admins can create resources
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can create resources' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createResourceSchema.parse(body);

    // Create resource
    const { data: newResource, error: createError } = await supabase
      .from('organization_resources')
      .insert({
        organization_id: userWithOrg.organization.id,
        created_by: user.id,
        ...validatedData
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      success: true,
      message: 'Resource created successfully',
      data: newResource
    }, { status: 201 });

  } catch (error) {
    console.error('Create resource error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}