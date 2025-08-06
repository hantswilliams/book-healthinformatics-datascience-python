import type { Chapter } from '@/types';

export const chapters: Chapter[] = [
  {
    id: 'chapter1',
    title: 'Chapter 1 - Python Basics',
    emoji: '📚',
    order: 1,
    sections: [
      { type: 'markdown', url: '/docs/chapter1-introduction.md', title: 'Introduction to Python' },
      { type: 'python', url: '/python/chapter1-hello-world.py', title: 'Your First Python Program' },
      { type: 'markdown', url: '/docs/chapter1-variables.md', title: 'Variables and Data Types' },
      { type: 'python', url: '/python/chapter1-variables-exercise.py', title: 'Variables Practice' },
      { type: 'markdown', url: '/docs/chapter1-summary.md', title: 'Chapter Summary' }
    ]
  },
  {
    id: 'chapter2',
    title: 'Chapter 2 - Data Analysis with Pandas',
    emoji: '🐼',
    order: 2,
    sections: [
      { type: 'markdown', url: '/docs/chapter2-introduction.md', title: 'Introduction to Pandas' },
      { type: 'python', url: '/python/chapter2-pandas-basics.py', title: 'Loading and Exploring Data' },
      { type: 'markdown', url: '/docs/chapter2-data-manipulation.md', title: 'Data Manipulation Concepts' },
      { type: 'python', url: '/python/chapter2-filtering-sorting.py', title: 'Filtering and Sorting Practice' },
      { type: 'markdown', url: '/docs/chapter2-visualization.md', title: 'Data Visualization Basics' },
      { type: 'python', url: '/python/chapter2-plotting.py', title: 'Creating Charts' }
    ]
  }
];

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(chapter => chapter.id === id);
};

export const getChapterByOrder = (order: number): Chapter | undefined => {
  return chapters.find(chapter => chapter.order === order);
};