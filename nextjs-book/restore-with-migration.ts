import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const prisma = new PrismaClient()

async function restoreAndMigrate() {
  console.log('🔄 Restoring data with new hierarchical structure...')

  try {
    // Read backup data
    const backup = JSON.parse(fs.readFileSync('data-backup.json', 'utf8'))
    console.log('📖 Loaded backup data from', backup.timestamp)

    // Step 1: Create or get default book
    console.log('📚 Setting up default book...')
    let defaultBook = await prisma.book.findUnique({
      where: { slug: 'python-healthcare' }
    })

    if (!defaultBook) {
      defaultBook = await prisma.book.create({
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
      console.log(`✅ Created book: ${defaultBook.title}`)
    } else {
      console.log(`✅ Found existing book: ${defaultBook.title}`)
    }

    // Step 2: Restore users (skip if already exist)
    console.log('👥 Restoring users...')
    const userIdMap = new Map()
    
    for (const user of backup.users) {
      // Check if user already exists
      let existingUser = await prisma.user.findUnique({
        where: { username: user.username }
      })

      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password, // Already hashed
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        })
        console.log(`✅ Created user: ${user.username}`)
      } else {
        console.log(`✅ Found existing user: ${user.username}`)
      }
      
      userIdMap.set(user.id, existingUser.id)
    }

    // Step 3: Create or update admin user
    console.log('👤 Setting up admin user...')
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    // Check if admin user already exists (from backup data)
    let adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (adminUser) {
      // Update existing admin user
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'ADMIN',
        }
      })
      console.log(`✅ Updated existing admin user: ${adminUser.username}`)
    } else {
      // Create new admin user
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@admin.com',
          firstName: 'Admin',
          lastName: 'User',
          password: hashedPassword,
          role: 'ADMIN',
        }
      })
      console.log(`✅ Created new admin user: ${adminUser.username}`)
    }

    // Step 4: Restore chapters with book reference
    console.log('📖 Restoring chapters...')
    const chapterIdMap = new Map()
    
    for (const chapter of backup.chapters) {
      // Check if chapter already exists
      let existingChapter = await prisma.chapter.findUnique({
        where: { id: chapter.id }
      })

      if (!existingChapter) {
        existingChapter = await prisma.chapter.create({
          data: {
            id: chapter.id, // Keep same ID for consistency
            bookId: defaultBook.id, // NEW: Link to book
            title: chapter.title,
            emoji: chapter.emoji,
            order: chapter.order,
            markdownUrl: chapter.markdownUrl,
            pythonUrl: chapter.pythonUrl,
            isPublished: true,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
          }
        })
        console.log(`✅ Created chapter: ${chapter.title}`)
      } else {
        // Update existing chapter to ensure it has bookId
        existingChapter = await prisma.chapter.update({
          where: { id: chapter.id },
          data: { bookId: defaultBook.id }
        })
        console.log(`✅ Updated existing chapter: ${chapter.title}`)
      }
      
      chapterIdMap.set(chapter.id, existingChapter.id)
    }

    // Step 5: Create book access for all users (including admin)
    console.log('🔐 Creating book access...')
    
    // Give all restored users access to the book
    for (const [oldUserId, newUserId] of userIdMap) {
      const existingAccess = await prisma.bookAccess.findUnique({
        where: {
          userId_bookId: {
            userId: newUserId,
            bookId: defaultBook.id
          }
        }
      })

      if (!existingAccess) {
        await prisma.bookAccess.create({
          data: {
            userId: newUserId,
            bookId: defaultBook.id,
            accessType: 'READ',
            grantedBy: adminUser.id,
          }
        })
      }
    }

    // Give admin full access
    const adminAccess = await prisma.bookAccess.findUnique({
      where: {
        userId_bookId: {
          userId: adminUser.id,
          bookId: defaultBook.id
        }
      }
    })

    if (!adminAccess) {
      await prisma.bookAccess.create({
        data: {
          userId: adminUser.id,
          bookId: defaultBook.id,
          accessType: 'ADMIN',
          grantedBy: adminUser.id,
        }
      })
    }
    
    console.log(`✅ Ensured book access for ${userIdMap.size + 1} users`)

    // Step 6: Restore progress with book reference
    console.log('📊 Restoring progress...')
    for (const progress of backup.progress) {
      const newUserId = userIdMap.get(progress.userId)
      if (newUserId) {
        await prisma.progress.create({
          data: {
            userId: newUserId,
            bookId: defaultBook.id, // NEW: Link to book
            chapterId: progress.chapterId,
            completed: progress.completed,
            completedAt: progress.completedAt,
            createdAt: progress.createdAt,
            updatedAt: progress.updatedAt,
          }
        })
      }
    }
    console.log(`✅ Restored ${backup.progress.length} progress records`)

    // Step 7: Restore exercises
    console.log('🏃‍♂️ Restoring exercises...')
    for (const exercise of backup.exercises) {
      const newUserId = userIdMap.get(exercise.userId)
      if (newUserId) {
        await prisma.exercise.create({
          data: {
            userId: newUserId,
            chapterId: exercise.chapterId,
            title: exercise.title,
            code: exercise.code,
            isCorrect: exercise.isCorrect,
            attempts: exercise.attempts,
            createdAt: exercise.createdAt,
            updatedAt: exercise.updatedAt,
          }
        })
      }
    }
    console.log(`✅ Restored ${backup.exercises.length} exercises`)

    console.log('🎉 Migration and restore completed successfully!')
    
    // Summary
    console.log('\n📋 Migration Summary:')
    console.log(`- Created 1 book: "${defaultBook.title}"`)
    console.log(`- Restored ${backup.users.length} existing users`)
    console.log(`- Created 1 admin user (admin@admin.com / 123456)`)
    console.log(`- Restored ${backup.chapters.length} chapters`)
    console.log(`- Created book access for ${userIdMap.size + 1} users`)
    console.log(`- Restored ${backup.progress.length} progress records`)
    console.log(`- Restored ${backup.exercises.length} exercises`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

restoreAndMigrate()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })