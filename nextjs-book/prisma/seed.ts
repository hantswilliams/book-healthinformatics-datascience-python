import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create chapters
  const chapters = [
    {
      id: 'chapter1',
      title: 'Chapter 1 - Python Basics',
      emoji: '📚',
      order: 1,
      markdownUrl: '/docs/chapter1_example1.md',
      pythonUrl: '/python/chapter1_example1.py'
    },
    {
      id: 'chapter2',
      title: 'Chapter 2 - Data Analysis with Pandas',
      emoji: '🐼',
      order: 2,
      markdownUrl: '/docs/chapter2_pandas.md',
      pythonUrl: '/python/chapter2_pandas_examples.py'
    }
  ];

  console.log('📚 Creating chapters...');
  for (const chapter of chapters) {
    await prisma.chapter.upsert({
      where: { id: chapter.id },
      update: {},
      create: chapter
    });
    console.log(`✅ Created chapter: ${chapter.title}`);
  }

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = [
    {
      username: 'admin',
      email: 'admin@healthinformatics.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN' as const
    },
    {
      username: 'instructor',
      email: 'instructor@healthinformatics.com',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      password: hashedPassword,
      role: 'INSTRUCTOR' as const
    },
    {
      username: 'student1',
      email: 'student1@healthinformatics.com',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'STUDENT' as const
    },
    {
      username: 'student2',
      email: 'student2@healthinformatics.com',
      firstName: 'Jane',
      lastName: 'Wilson',
      password: hashedPassword,
      role: 'STUDENT' as const
    }
  ];

  console.log('👥 Creating users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
    console.log(`✅ Created user: ${user.username} (${user.role})`);
  }

  // Create some sample progress for students
  console.log('📈 Creating sample progress...');
  const student1 = await prisma.user.findUnique({ where: { username: 'student1' } });
  const student2 = await prisma.user.findUnique({ where: { username: 'student2' } });

  if (student1) {
    // Student1 has completed chapter1
    await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId: student1.id,
          chapterId: 'chapter1'
        }
      },
      update: {},
      create: {
        userId: student1.id,
        chapterId: 'chapter1',
        completed: true,
        completedAt: new Date()
      }
    });

    // Student1 has started chapter2 but not completed
    await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId: student1.id,
          chapterId: 'chapter2'
        }
      },
      update: {},
      create: {
        userId: student1.id,
        chapterId: 'chapter2',
        completed: false
      }
    });

    console.log('✅ Created progress for student1');
  }

  if (student2) {
    // Student2 has started chapter1 but not completed
    await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId: student2.id,
          chapterId: 'chapter1'
        }
      },
      update: {},
      create: {
        userId: student2.id,
        chapterId: 'chapter1',
        completed: false
      }
    });

    console.log('✅ Created progress for student2');
  }

  // Create some sample exercises
  console.log('🏃‍♂️ Creating sample exercises...');
  if (student1) {
    await prisma.exercise.create({
      data: {
        userId: student1.id,
        chapterId: 'chapter1',
        title: 'Hello World Exercise',
        code: 'print("Hello, Healthcare World!")',
        isCorrect: true,
        attempts: 1
      }
    });

    await prisma.exercise.create({
      data: {
        userId: student1.id,
        chapterId: 'chapter1',
        title: 'Variables Exercise',
        code: 'patient_name = "John Doe"\nprint(f"Patient: {patient_name}")',
        isCorrect: true,
        attempts: 2
      }
    });

    console.log('✅ Created sample exercises for student1');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });