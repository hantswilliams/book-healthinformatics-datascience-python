export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName: string;
  role: 'admin' | 'instructor' | 'student';
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  emoji: string;
  order: number;
  sections: Array<{
    type: 'markdown' | 'python';
    url: string;
    title?: string;
  }>;
}

export interface Exercise {
  id: string;
  chapterId: string;
  title: string;
  code: string;
  isCorrect: boolean;
  attempts: number;
}

export interface Progress {
  id: string;
  userId: string;
  chapterId: string;
  completed: boolean;
  completedAt?: Date;
  exercises: Exercise[];
}

export interface PyodideInstance {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (packages: string | string[]) => Promise<void>;
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => unknown;
  };
}

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInstance>;
  }
}