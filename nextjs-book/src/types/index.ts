export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  emoji: string;
  order: number;
  estimatedMinutes?: number;
  defaultExecutionMode?: string;
  bookTitle?: string;
  sections: Array<{
    id: string;
    type: 'markdown' | 'python' | 'youtube' | 'image';
    content: string;
    title?: string;
    order: number;
    executionMode?: string;
    dependsOn?: string[];
    url?: string; // Legacy field
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

export interface CodeExecution {
  id: string;
  userId: string;
  organizationId: string;
  chapterId: string;
  sectionId: string;
  codeContent: string;
  executionResult?: string;
  executionStatus: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  executionMode: 'shared' | 'isolated';
  contextId: string;
  executedAt: Date;
  sessionId?: string;
}

export interface CodeExecutionStats {
  organizationId: string;
  userId: string;
  firstName?: string;
  lastName: string;
  email: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  totalExecutions: number;
  successfulExecutions: number;
  errorExecutions: number;
  lastExecution: Date;
  firstExecution: Date;
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