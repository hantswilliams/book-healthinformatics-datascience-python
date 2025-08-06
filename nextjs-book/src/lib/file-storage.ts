import fs from 'fs/promises';
import path from 'path';

// Simple file storage utility for development
// In production, you'd want to use a proper storage service like AWS S3, Cloudinary, etc.

const STORAGE_DIR = path.join(process.cwd(), 'uploads', 'books');

export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

export async function saveFileContent(
  organizationId: string, 
  bookSlug: string, 
  filename: string, 
  content: string
): Promise<string> {
  await ensureStorageDir();
  
  const organizationDir = path.join(STORAGE_DIR, organizationId);
  const bookDir = path.join(organizationDir, bookSlug);
  
  // Create directories if they don't exist
  await fs.mkdir(bookDir, { recursive: true });
  
  // Clean filename
  const cleanFilename = filename.replace(/[^a-z0-9.-]/gi, '_');
  const filePath = path.join(bookDir, cleanFilename);
  
  // Save content to file
  await fs.writeFile(filePath, content, 'utf8');
  
  // Return relative path that can be served
  return path.join('uploads', 'books', organizationId, bookSlug, cleanFilename);
}

export async function getFileContent(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath, 'utf8');
  } catch (error) {
    console.error('Failed to read file:', error);
    throw new Error('File not found');
  }
}

export async function deleteBookFiles(organizationId: string, bookSlug: string) {
  try {
    const bookDir = path.join(STORAGE_DIR, organizationId, bookSlug);
    await fs.rm(bookDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to delete book files:', error);
  }
}