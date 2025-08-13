import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const findOrganizationsSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = findOrganizationsSchema.parse(body);
    
    // Use service role key for this public endpoint
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find all users with this email across organizations
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        first_name,
        last_name,
        is_active,
        organization:organizations(
          id,
          slug,
          name,
          logo,
          industry,
          subscription_status
        )
      `)
      .eq('email', email.toLowerCase())
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to find organizations',
        organizations: [],
      }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No account found with this email address',
        organizations: [],
      });
    }

    // Map to organization data (remove duplicates if user somehow exists multiple times)
    const organizations = users
      .map(user => ({
        id: user.organization.id,
        slug: user.organization.slug,
        name: user.organization.name,
        logo: user.organization.logo,
        industry: user.organization.industry,
        subscriptionStatus: user.organization.subscription_status,
        userRole: user.role,
        userFirstName: user.first_name,
        userLastName: user.last_name,
      }))
      .filter((org, index, self) => 
        index === self.findIndex(o => o.id === org.id)
      );

    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    });

  } catch (error) {
    console.error('Error finding organizations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format',
          organizations: [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to find organizations',
        organizations: [],
      },
      { status: 500 }
    );
  }
}