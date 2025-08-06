import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function backupData() {
  console.log('💾 Backing up existing data...')

  try {
    // Get all existing data
    const users = await prisma.user.findMany()
    const chapters = await prisma.chapter.findMany()
    const progress = await prisma.progress.findMany()  
    const exercises = await prisma.exercise.findMany()

    const backup = {
      users,
      chapters, 
      progress,
      exercises,
      timestamp: new Date().toISOString()
    }

    // Save to JSON file
    fs.writeFileSync('data-backup.json', JSON.stringify(backup, null, 2))
    
    console.log('✅ Data backed up to data-backup.json')
    console.log(`- ${users.length} users`)
    console.log(`- ${chapters.length} chapters`)
    console.log(`- ${progress.length} progress records`)
    console.log(`- ${exercises.length} exercises`)

  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backupData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })