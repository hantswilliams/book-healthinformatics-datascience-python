import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting migration to hierarchical book structure...')

  try {
    // Step 1: Create default book
    console.log('📚 Creating default book...')
    const defaultBook = await prisma.book.create({
      data: {
        slug: 'python-healthcare',
        title: 'Python for Healthcare Data Science',
        description: 'Learn Python programming for healthcare data analysis with interactive lessons and real-world examples.',
        difficulty: 'BEGINNER',
        estimatedHours: 20,
        isPublished: true,
        order: 1,
      }
    })
    console.log(`✅ Created book: ${defaultBook.title} (ID: ${defaultBook.id})`)

    // Step 2: Get all existing chapters and update them to belong to the default book
    console.log('📖 Migrating existing chapters...')
    const existingChapters = await prisma.chapter.findMany()
    
    for (const chapter of existingChapters) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { bookId: defaultBook.id }
      })
      console.log(`✅ Updated chapter: ${chapter.title}`)
    }

    // Step 3: Update all existing progress records to include bookId
    console.log('📊 Migrating progress records...')
    const existingProgress = await prisma.progress.findMany()
    
    for (const progress of existingProgress) {
      await prisma.progress.update({
        where: { id: progress.id },
        data: { bookId: defaultBook.id }
      })
    }
    console.log(`✅ Updated ${existingProgress.length} progress records`)

    // Step 4: Give all existing users access to the default book
    console.log('🔐 Creating book access for existing users...')
    const existingUsers = await prisma.user.findMany()
    
    for (const user of existingUsers) {
      await prisma.bookAccess.create({
        data: {
          userId: user.id,
          bookId: defaultBook.id,
          accessType: 'READ',
          grantedBy: null, // System migration
        }
      })
      console.log(`✅ Granted access to user: ${user.username}`)
    }

    // Step 5: Create admin user
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    try {
      const adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@admin.com',
          firstName: 'Admin',
          lastName: 'User',
          password: hashedPassword,
          role: 'ADMIN',
        }
      })

      // Give admin user full access to all books
      await prisma.bookAccess.create({
        data: {
          userId: adminUser.id,
          bookId: defaultBook.id,
          accessType: 'ADMIN',
          grantedBy: adminUser.id,
        }
      })

      console.log(`✅ Created admin user: ${adminUser.username} (${adminUser.email})`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('⚠️  Admin user already exists, skipping creation')
      } else {
        throw error
      }
    }

    console.log('🎉 Migration completed successfully!')
    
    // Summary
    console.log('\n📋 Migration Summary:')
    console.log(`- Created 1 default book: "${defaultBook.title}"`)
    console.log(`- Migrated ${existingChapters.length} chapters`)
    console.log(`- Updated ${existingProgress.length} progress records`)
    console.log(`- Created book access for ${existingUsers.length} existing users`)
    console.log('- Created admin user (admin@admin.com / 123456)')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })