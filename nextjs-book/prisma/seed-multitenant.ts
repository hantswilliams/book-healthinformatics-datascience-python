import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding multi-tenant database...');

  // Create test organization
  const testOrg = await prisma.organization.create({
    data: {
      name: 'Acme Healthcare',
      slug: 'acme-healthcare',
      industry: 'HEALTHCARE',
      website: 'https://acme-healthcare.com',
      description: 'Healthcare data science team',
      subscriptionStatus: 'TRIAL',
      subscriptionTier: 'STARTER',
      maxSeats: 5,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    }
  });

  console.log(`✅ Created organization: ${testOrg.name}`);

  // Create test owner user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const ownerUser = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme-healthcare.com',
      username: 'johndoe',
      password: hashedPassword,
      role: 'OWNER',
      organizationId: testOrg.id,
      onboardingCompleted: true,
    }
  });

  console.log(`✅ Created owner user: ${ownerUser.email}`);

  // Create test admin user
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme-healthcare.com',
      username: 'janesmith',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: testOrg.id,
      invitedBy: ownerUser.id,
    }
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create test learner user
  const learnerUser = await prisma.user.create({
    data: {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@acme-healthcare.com',
      username: 'bobwilson',
      password: hashedPassword,
      role: 'LEARNER',
      organizationId: testOrg.id,
      invitedBy: adminUser.id,
    }
  });

  console.log(`✅ Created learner user: ${learnerUser.email}`);

  // Create a sample book
  const sampleBook = await prisma.book.create({
    data: {
      id: 'book-python-healthcare',
      slug: 'python-healthcare-basics',
      title: 'Python for Healthcare Data Analysis',
      description: 'Learn Python specifically for healthcare data science',
      difficulty: 'BEGINNER',
      estimatedHours: 10,
      category: 'HEALTHCARE',
      tags: '["python", "healthcare", "pandas", "numpy"]',
      organizationId: testOrg.id, // Organization-specific book
      createdBy: adminUser.id,
      isPublished: true,
      isPublic: false,
      order: 1,
    }
  });

  console.log(`✅ Created sample book: ${sampleBook.title}`);

  // Create sample chapters
  const chapters = [
    {
      id: 'chapter-1-intro',
      title: 'Introduction to Healthcare Data',
      emoji: '🏥',
      order: 1,
      markdownUrl: '/docs/chapter1-introduction.md',
      pythonUrl: '/python/chapter1-hello-world.py',
    },
    {
      id: 'chapter-2-pandas',
      title: 'Data Manipulation with Pandas',
      emoji: '🐼',
      order: 2,
      markdownUrl: '/docs/chapter2-data-manipulation.md',
      pythonUrl: '/python/chapter2-pandas-basics.py',
    }
  ];

  for (const chapterData of chapters) {
    const chapter = await prisma.chapter.create({
      data: {
        ...chapterData,
        bookId: sampleBook.id,
        estimatedMinutes: 45,
      }
    });
    console.log(`✅ Created chapter: ${chapter.title}`);
  }

  // Grant book access to the organization
  await prisma.bookAccess.create({
    data: {
      organizationId: testOrg.id,
      bookId: sampleBook.id,
      accessType: 'READ',
      grantedBy: ownerUser.id,
    }
  });

  console.log(`✅ Granted book access to organization`);

  // Create billing event for trial start
  await prisma.billingEvent.create({
    data: {
      organizationId: testOrg.id,
      eventType: 'TRIAL_STARTED',
      metadata: JSON.stringify({
        subscriptionTier: 'STARTER',
        trialDays: 14
      }),
    }
  });

  console.log(`✅ Created trial billing event`);

  // Create a test invitation
  await prisma.invitation.create({
    data: {
      email: 'newmember@acme-healthcare.com',
      organizationId: testOrg.id,
      invitedBy: ownerUser.id,
      role: 'LEARNER',
      token: 'test-invitation-token-12345',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });

  console.log(`✅ Created test invitation`);

  console.log('\n🎉 Multi-tenant database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('👑 Owner: john@acme-healthcare.com / password123');
  console.log('🔧 Admin: jane@acme-healthcare.com / password123');
  console.log('📚 Learner: bob@acme-healthcare.com / password123');
  console.log('\n🏢 Organization: Acme Healthcare (acme-healthcare)');
  console.log('📖 Sample Book: Python for Healthcare Data Analysis');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });