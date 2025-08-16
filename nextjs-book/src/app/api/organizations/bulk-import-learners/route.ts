import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const bulkImportSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
});

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

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user's details from database
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser || currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can bulk import learners' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emails } = bulkImportSchema.parse(body);

    console.log(`🔄 Bulk importing ${emails.length} learners for organization ${currentUser.organization_id}`);

    // Remove duplicates and normalize emails
    const uniqueEmails = [...new Set(emails.map(email => email.toLowerCase().trim()))];
    
    // Check which emails already exist in the organization
    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('email')
      .eq('organization_id', currentUser.organization_id)
      .in('email', uniqueEmails);

    if (existingError) {
      console.error('Error checking existing users:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const existingEmails = new Set(existingUsers?.map(u => u.email) || []);
    const newEmails = uniqueEmails.filter(email => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All emails already exist in the organization',
        results: {
          total: uniqueEmails.length,
          added: 0,
          skipped: uniqueEmails.length,
          errors: []
        }
      });
    }

    console.log(`📧 Adding ${newEmails.length} new learners (${existingEmails.size} already exist)`);

    // Get existing usernames to ensure uniqueness
    const { data: existingUsernames, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('organization_id', currentUser.organization_id);

    if (usernameError) {
      console.error('Error checking existing usernames:', usernameError);
      return NextResponse.json(
        { error: 'Failed to check existing usernames' },
        { status: 500 }
      );
    }

    const existingUsernameSet = new Set(existingUsernames?.map(u => u.username) || []);

    // Function to generate unique username
    const generateUniqueUsername = (email: string): string => {
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // If username already exists, append numbers until we find a unique one
      while (existingUsernameSet.has(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Add to set to avoid duplicates within this batch
      existingUsernameSet.add(username);
      return username;
    };

    // Prepare user records for bulk insert
    const newUsers = newEmails.map(email => ({
      email,
      username: generateUniqueUsername(email),
      first_name: null,
      last_name: email.split('@')[0], // Use email prefix as last name initially
      role: 'LEARNER' as const,
      organization_id: currentUser.organization_id,
      is_active: true,
      joined_at: new Date().toISOString(),
    }));

    // Bulk insert new users
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert(newUsers)
      .select('id, email');

    if (insertError) {
      console.error('Error inserting users:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user accounts' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully added ${insertedUsers?.length || 0} learners`);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${newEmails.length} learners`,
      results: {
        total: uniqueEmails.length,
        added: newEmails.length,
        skipped: existingEmails.size,
        errors: [],
        addedUsers: insertedUsers
      }
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid email data', 
          details: error.issues.map(issue => issue.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to import learners: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}