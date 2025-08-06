import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization first
  console.log('🏢 Creating organization...');
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'Demo organization for testing',
      industry: 'HEALTHCARE',
      subscriptionStatus: 'TRIAL',
      subscriptionTier: 'STARTER',
      maxSeats: 5,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  console.log('👥 Creating users...');
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo-org.com' },
    update: {},
    create: {
      username: 'owner',
      email: 'owner@demo-org.com',
      firstName: 'Owner',
      lastName: 'User',
      password: hashedPassword,
      role: 'OWNER',
      organizationId: organization.id,
      onboardingCompleted: true
    }
  });
  console.log(`✅ Created owner user: ${owner.email}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo-org.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@demo-org.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: organization.id,
      onboardingCompleted: true
    }
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@demo-org.com' },
    update: {},
    create: {
      username: 'instructor',
      email: 'instructor@demo-org.com',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      organizationId: organization.id,
      onboardingCompleted: true
    }
  });
  console.log(`✅ Created instructor user: ${instructor.email}`);

  const learner = await prisma.user.upsert({
    where: { email: 'learner@demo-org.com' },
    update: {},
    create: {
      username: 'learner',
      email: 'learner@demo-org.com',
      firstName: 'Student',
      lastName: 'Johnson',
      password: hashedPassword,
      role: 'LEARNER',
      organizationId: organization.id,
      onboardingCompleted: true
    }
  });
  console.log(`✅ Created learner user: ${learner.email}`);

  // Create a demo book
  console.log('📚 Creating demo book...');
  const book = await prisma.book.upsert({
    where: { slug: 'python-basics-demo' },
    update: {},
    create: {
      slug: 'python-basics-demo',
      title: 'Python Basics for Healthcare',
      description: 'Learn Python programming fundamentals with healthcare examples',
      difficulty: 'BEGINNER',
      estimatedHours: 8,
      category: 'HEALTHCARE',
      tags: '["python", "healthcare", "beginner", "programming"]',
      organizationId: organization.id,
      createdBy: admin.id,
      isPublished: true,
      isPublic: false,
      order: 1
    }
  });
  console.log(`✅ Created book: ${book.title}`);

  // Create chapters with sections
  console.log('📖 Creating chapters...');
  const chapter1 = await prisma.chapter.upsert({
    where: { id: 'python-basics-demo-chapter-1' },
    update: {},
    create: {
      id: 'python-basics-demo-chapter-1',
      bookId: book.id,
      title: 'Introduction to Python',
      emoji: '🐍',
      order: 1,
      markdownUrl: '', // Will be populated by sections
      pythonUrl: '',   // Will be populated by sections
      isPublished: true,
      estimatedMinutes: 30
    }
  });

  // Create sections for chapter 1
  console.log('📄 Creating sections for chapter 1...');
  await prisma.section.create({
    data: {
      chapterId: chapter1.id,
      title: 'What is Python?',
      type: 'MARKDOWN',
      order: 1,
      content: `# Introduction to Python

Python is a high-level, interpreted programming language that's perfect for healthcare data analysis.

## Why Python for Healthcare?

- **Easy to learn**: Simple syntax that reads like English
- **Powerful libraries**: NumPy, Pandas, Matplotlib for data analysis
- **Healthcare focus**: Libraries like BioPython for bioinformatics
- **Community**: Large healthcare data science community`
    }
  });

  await prisma.section.create({
    data: {
      chapterId: chapter1.id,
      title: 'Your First Python Program',
      type: 'PYTHON',
      order: 2,
      content: `# Your first Python program
print("Hello, Healthcare World!")

# Variables in Python
patient_name = "John Doe"
age = 45
height_cm = 175.5

print(f"Patient: {patient_name}")
print(f"Age: {age} years")
print(f"Height: {height_cm} cm")`
    }
  });

  await prisma.section.create({
    data: {
      chapterId: chapter1.id,
      title: 'Understanding Variables',
      type: 'MARKDOWN',
      order: 3,
      content: `## Variables in Healthcare Context

Variables are containers for storing data values. In healthcare applications, we commonly use:

- **Strings**: Patient names, medical conditions
- **Numbers**: Ages, vital signs, lab values
- **Booleans**: Treatment status (True/False)

Let's see more examples with healthcare data.`
    }
  });

  await prisma.section.create({
    data: {
      chapterId: chapter1.id,
      title: 'Healthcare Data Examples',
      type: 'PYTHON',
      order: 4,
      content: `# Healthcare data variables
patient_id = "HC001"
blood_pressure_systolic = 120
blood_pressure_diastolic = 80
has_diabetes = False
medications = ["Lisinopril", "Metformin", "Aspirin"]

# Working with patient data
print(f"Patient ID: {patient_id}")
print(f"BP: {blood_pressure_systolic}/{blood_pressure_diastolic}")
print(f"Diabetes: {'Yes' if has_diabetes else 'No'}")
print(f"Medications: {', '.join(medications)}")`
    }
  });

  const chapter2 = await prisma.chapter.upsert({
    where: { id: 'python-basics-demo-chapter-2' },
    update: {},
    create: {
      id: 'python-basics-demo-chapter-2',
      bookId: book.id,
      title: 'Working with Healthcare Data',
      emoji: '🏥',
      order: 2,
      markdownUrl: '',
      pythonUrl: '',
      isPublished: true,
      estimatedMinutes: 45
    }
  });

  // Create sections for chapter 2
  console.log('📄 Creating sections for chapter 2...');
  await prisma.section.create({
    data: {
      chapterId: chapter2.id,
      title: 'Introduction to Lists and Dictionaries',
      type: 'MARKDOWN',
      order: 1,
      content: `# Working with Patient Collections

In healthcare, we often need to work with collections of data:

- **Lists**: Multiple patients, test results, medications
- **Dictionaries**: Patient records with key-value pairs

These data structures are fundamental for healthcare data management.`
    }
  });

  await prisma.section.create({
    data: {
      chapterId: chapter2.id,
      title: 'Patient Data Structures',
      type: 'PYTHON',
      order: 2,
      content: `# Patient data using dictionaries
patient_record = {
    "id": "HC001",
    "name": "John Doe",
    "age": 45,
    "vital_signs": {
        "temperature": 98.6,
        "pulse": 72,
        "blood_pressure": "120/80"
    },
    "medications": ["Lisinopril", "Aspirin"],
    "allergies": ["Penicillin"]
}

# Accessing patient data
print(f"Patient: {patient_record['name']}")
print(f"Age: {patient_record['age']}")
print(f"Temperature: {patient_record['vital_signs']['temperature']}°F")

# Adding new medication
patient_record['medications'].append("Metformin")
print(f"Updated medications: {patient_record['medications']}")`
    }
  });

  console.log('✅ Created demo chapters with sections');

  // Grant book access to the organization
  console.log('🔑 Creating book access...');
  await prisma.bookAccess.upsert({
    where: { 
      organizationId_bookId: {
        organizationId: organization.id,
        bookId: book.id
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      bookId: book.id,
      accessType: 'ADMIN',
      grantedBy: owner.id
    }
  });
  console.log('✅ Granted book access to organization');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Demo accounts:');
  console.log('👑 Owner: owner@demo-org.com / password123');
  console.log('⚙️  Admin: admin@demo-org.com / password123');
  console.log('👨‍🏫 Instructor: instructor@demo-org.com / password123');
  console.log('🎓 Learner: learner@demo-org.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });