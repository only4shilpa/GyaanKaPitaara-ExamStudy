export interface Chapter {
  title: string
  titleHindi?: string
  summary: string
  keyConcepts: string[]
  examHighlights: ExamQuestion[]
}

export interface ExamQuestion {
  question: string
  answer: string
  year?: string
  marks?: string
}

export interface Subject {
  id: string
  name: string
  nameHindi?: string
  createdAt: string
  chapters: Chapter[]
  combinedAnswerKey: AnswerKeyItem[]
  questionCount: number
}

export interface AnswerKeyItem {
  chapter: string
  question: string
  answer: string
  year?: string
  marks?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  type?: 'quiz' | 'evaluate' | 'chat'
}
