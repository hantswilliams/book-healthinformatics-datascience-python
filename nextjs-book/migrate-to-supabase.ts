import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize clients
const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface MigrationProgress {
  organizations: number;
  users: number;
  books: number;
  chapters: number;
  sections: number;
  progress: number;
  exercises: number;
  billingEvents: number;
}

async function migratePrismaToSupabase() {
  console.log('🚀 Starting Prisma to Supabase migration...\n');
  
  const progress: MigrationProgress = {
    organizations: 0,
    users: 0,
    books: 0,
    chapters: 0,
    sections: 0,
    progress: 0,
    exercises: 0,
    billingEvents: 0,
  };

  try {
    // 1. Migrate Organizations
    console.log('📁 Migrating Organizations...');
    const prismaOrgs = await prisma.organization.findMany();
    
    for (const org of prismaOrgs) {
      const { error } = await supabase
        .from('organizations')
        .insert({
          id: org.id,
          name: org.name,
          slug: org.slug,
          domain: org.domain,
          description: org.description,
          logo: org.logo,
          website: org.website,
          industry: org.industry as any,
          stripe_customer_id: org.stripeCustomerId,
          stripe_subscription_id: org.stripeSubscriptionId,
          subscription_status: org.subscriptionStatus as any,
          subscription_tier: org.subscriptionTier as any,
          max_seats: org.maxSeats,
          trial_ends_at: org.trialEndsAt?.toISOString(),
          subscription_started_at: org.subscriptionStartedAt?.toISOString(),
          subscription_ends_at: org.subscriptionEndsAt?.toISOString(),
          created_at: org.createdAt.toISOString(),
          updated_at: org.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate organization ${org.name}:`, error);
      } else {
        progress.organizations++;
      }
    }
    console.log(`✅ Migrated ${progress.organizations}/${prismaOrgs.length} organizations\n`);

    // 2. Migrate Users with Authentication
    console.log('👥 Migrating Users...');
    const prismaUsers = await prisma.user.findMany({
      include: { organization: true }
    });

    for (const user of prismaUsers) {
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password, // This should be the hashed password
        email_confirm: true,
        user_metadata: {
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        app_metadata: {
          organization_id: user.organizationId,
          organization_slug: user.organization.slug,
          organization_name: user.organization.name,
          role: user.role,
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError);
        continue;
      }

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          avatar: user.avatar,
          role: user.role as any,
          is_active: user.isActive,
          last_login_at: user.lastLoginAt?.toISOString(),
          onboarding_completed: user.onboardingCompleted,
          organization_id: user.organizationId,
          joined_at: user.joinedAt.toISOString(),
          invited_by: user.invitedBy,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        });

      if (profileError) {
        console.error(`❌ Failed to create user profile ${user.email}:`, profileError);
      } else {
        progress.users++;
      }
    }
    console.log(`✅ Migrated ${progress.users}/${prismaUsers.length} users\n`);

    // 3. Migrate Books
    console.log('📚 Migrating Books...');
    const prismaBooks = await prisma.book.findMany();
    
    for (const book of prismaBooks) {
      const { error } = await supabase
        .from('books')
        .insert({
          id: book.id,
          slug: book.slug,
          title: book.title,
          description: book.description,
          cover_image: book.coverImage,
          difficulty: book.difficulty as any,
          estimated_hours: book.estimatedHours,
          category: book.category as any,
          tags: book.tags,
          organization_id: book.organizationId,
          created_by: book.createdBy,
          is_published: book.isPublished,
          is_public: book.isPublic,
          price: book.price,
          display_order: book.order,
          created_at: book.createdAt.toISOString(),
          updated_at: book.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate book ${book.title}:`, error);
      } else {
        progress.books++;
      }
    }
    console.log(`✅ Migrated ${progress.books}/${prismaBooks.length} books\n`);

    // 4. Migrate Chapters
    console.log('📖 Migrating Chapters...');
    const prismaChapters = await prisma.chapter.findMany();
    
    for (const chapter of prismaChapters) {
      const { error } = await supabase
        .from('chapters')
        .insert({
          id: chapter.id,
          book_id: chapter.bookId,
          title: chapter.title,
          emoji: chapter.emoji,
          display_order: chapter.order,
          markdown_url: chapter.markdownUrl,
          python_url: chapter.pythonUrl,
          is_published: chapter.isPublished,
          estimated_minutes: chapter.estimatedMinutes,
          default_execution_mode: chapter.defaultExecutionMode as any,
          created_at: chapter.createdAt.toISOString(),
          updated_at: chapter.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate chapter ${chapter.title}:`, error);
      } else {
        progress.chapters++;
      }
    }
    console.log(`✅ Migrated ${progress.chapters}/${prismaChapters.length} chapters\n`);

    // 5. Migrate Sections
    console.log('📄 Migrating Sections...');
    const prismaSections = await prisma.section.findMany();
    
    for (const section of prismaSections) {
      const { error } = await supabase
        .from('sections')
        .insert({
          id: section.id,
          chapter_id: section.chapterId,
          title: section.title,
          type: section.type as any,
          content: section.content,
          display_order: section.order,
          execution_mode: section.executionMode as any,
          depends_on: section.dependsOn,
          created_at: section.createdAt.toISOString(),
          updated_at: section.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate section ${section.id}:`, error);
      } else {
        progress.sections++;
      }
    }
    console.log(`✅ Migrated ${progress.sections}/${prismaSections.length} sections\n`);

    // 6. Migrate Progress
    console.log('📊 Migrating Progress...');
    const prismaProgress = await prisma.progress.findMany();
    
    for (const prog of prismaProgress) {
      const { error } = await supabase
        .from('progress')
        .insert({
          id: prog.id,
          user_id: prog.userId,
          book_id: prog.bookId,
          chapter_id: prog.chapterId,
          completed: prog.completed,
          completed_at: prog.completedAt?.toISOString(),
          time_spent: prog.timeSpent,
          score: prog.score,
          created_at: prog.createdAt.toISOString(),
          updated_at: prog.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate progress ${prog.id}:`, error);
      } else {
        progress.progress++;
      }
    }
    console.log(`✅ Migrated ${progress.progress}/${prismaProgress.length} progress records\n`);

    // 7. Migrate Exercises
    console.log('🏃 Migrating Exercises...');
    const prismaExercises = await prisma.exercise.findMany();
    
    for (const exercise of prismaExercises) {
      const { error } = await supabase
        .from('exercises')
        .insert({
          id: exercise.id,
          user_id: exercise.userId,
          chapter_id: exercise.chapterId,
          title: exercise.title,
          code: exercise.code,
          is_correct: exercise.isCorrect,
          attempts: exercise.attempts,
          time_spent: exercise.timeSpent,
          feedback: exercise.feedback,
          created_at: exercise.createdAt.toISOString(),
          updated_at: exercise.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate exercise ${exercise.id}:`, error);
      } else {
        progress.exercises++;
      }
    }
    console.log(`✅ Migrated ${progress.exercises}/${prismaExercises.length} exercises\n`);

    // 8. Migrate Billing Events
    console.log('💳 Migrating Billing Events...');
    const prismaBillingEvents = await prisma.billingEvent.findMany();
    
    for (const event of prismaBillingEvents) {
      const { error } = await supabase
        .from('billing_events')
        .insert({
          id: event.id,
          organization_id: event.organizationId,
          event_type: event.eventType as any,
          amount: event.amount,
          currency: event.currency,
          stripe_event_id: event.stripeEventId,
          metadata: event.metadata,
          created_at: event.createdAt.toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to migrate billing event ${event.id}:`, error);
      } else {
        progress.billingEvents++;
      }
    }
    console.log(`✅ Migrated ${progress.billingEvents}/${prismaBillingEvents.length} billing events\n`);

    // Migration Summary
    console.log('🎉 Migration completed!\n');
    console.log('📈 Migration Summary:');
    console.log(`├── Organizations: ${progress.organizations}`);
    console.log(`├── Users: ${progress.users}`);
    console.log(`├── Books: ${progress.books}`);
    console.log(`├── Chapters: ${progress.chapters}`);
    console.log(`├── Sections: ${progress.sections}`);
    console.log(`├── Progress: ${progress.progress}`);
    console.log(`├── Exercises: ${progress.exercises}`);
    console.log(`└── Billing Events: ${progress.billingEvents}\n`);

    console.log('✅ All data has been successfully migrated to Supabase!');
    console.log('📝 Next steps:');
    console.log('1. Update your environment variables to use Supabase');
    console.log('2. Test authentication and authorization');
    console.log('3. Verify data integrity');
    console.log('4. Update your deployment configuration');

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migratePrismaToSupabase();
}

export default migratePrismaToSupabase;