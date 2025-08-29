import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { organizationId } = await params;
    
    // Check authentication and organization membership
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get package sets for this organization
    const { data: packageSets, error } = await supabase
      .from('organization_package_sets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch package sets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ packageSets: packageSets || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { organizationId } = await params;
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile || 
        userProfile.organization_id !== organizationId ||
        !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, category, icon, packages } = await request.json();

    // Create package set
    const { data: newPackageSet, error: setError } = await supabase
      .from('organization_package_sets')
      .insert({
        organization_id: organizationId,
        name,
        description,
        category,
        icon,
        created_by: user.id
      })
      .select()
      .single();

    if (setError) {
      console.error('Database error:', setError);
      return NextResponse.json(
        { error: 'Failed to create package set' },
        { status: 500 }
      );
    }

    // Add packages to set
    if (packages && packages.length > 0) {
      const packageItems = packages.map((pkg: any) => ({
        package_set_id: newPackageSet.id,
        package_id: pkg.package_id,
        load_order: pkg.load_order,
        required: pkg.required,
        custom_import_name: pkg.custom_import_name,
        pre_import_code: pkg.pre_import_code
      }));

      const { error: itemsError } = await supabase
        .from('package_set_items')
        .insert(packageItems);

      if (itemsError) {
        console.error('Database error:', itemsError);
        // Clean up the package set if adding items failed
        await supabase
          .from('organization_package_sets')
          .delete()
          .eq('id', newPackageSet.id);
        
        return NextResponse.json(
          { error: 'Failed to create package set items' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ packageSet: newPackageSet }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}