import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ExamReady — AI Study Assistant',
  description: 'Upload textbooks and past papers, get chapter summaries, and prepare for exams with an AI chatbot.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-amber-50 min-h-screen">{children}</body>
    </html>
  )
}
