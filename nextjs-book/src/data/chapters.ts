import type { Chapter } from '@/types';

export const chapters: Chapter[] = [
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

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(chapter => chapter.id === id);
};

export const getChapterByOrder = (order: number): Chapter | undefined => {
  return chapters.find(chapter => chapter.order === order);
};