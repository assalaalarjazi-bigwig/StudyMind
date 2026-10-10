export interface DocumentItem {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt';
  pageCount: number;
  wordCount?: number;
  sizeKb: number;
  hash: string;
  summary: string;
  fullText?: string;
  figuresCount: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: 'definition' | 'concept' | 'formula' | 'exam_prep';
  page: number;
  mastery: 0 | 1 | 2 | 3; // 0: new, 1: needs review, 2: learning, 3: mastered
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'multiple_choice' | 'true_false' | 'multi_select' | 'short_answer';
  options?: string[];
  correctAnswer: string[];
  explanation: string;
  page: number;
  conceptTag: string;
}

export interface DiagramItem {
  id: string;
  figureNumber: string;
  title: string;
  page: number;
  type: string;
  diagramType: string;
  description: string;
  aiAnalysis: string;
  steps?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { page: number; snippet: string }[];
}
