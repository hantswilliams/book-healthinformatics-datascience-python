'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/SupabaseProvider';
import type { Chapter } from '@/types';

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: string;
  isPublished: boolean;
  order: number;
  accessType: string;
  chapters: Chapter[];
}

interface BooksContextType {
  books: Book[];
  loading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useSupabase();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    if (!userProfile) {
      setBooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user-books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      } else {
        console.error('Failed to fetch user books - HTTP', response.status);
        setError('Failed to load courses');
        setBooks([]);
      }
    } catch (err) {
      console.error('Error fetching user books:', err);
      setError('Failed to load courses');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  const refreshBooks = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const value: BooksContextType = {
    books,
    loading,
    error,
    refreshBooks,
  };

  return (
    <BooksContext.Provider value={value}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooksData() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooksData must be used within a BooksProvider');
  }
  return context;
}