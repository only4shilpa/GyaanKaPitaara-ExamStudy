'use client'

import { useState } from 'react'
import { downloadText, formatDate } from '@/lib/utils'
import type { Subject, Chapter } from '@/lib/types'

interface Props {
  subjects: Subject[]
  selectedSubject: Subject | null
  onSelectSubject: (s: Subject) => void
  onGoToChat: (s: Subject) => void
}

export default function SummaryTab({ subjects, selectedSubject, onSelectSubject, onGoToChat }: Props) {
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const [activeInnerTab, setActiveInnerTab] = useState<'summaries' | 'answerkey'>('summaries')

  if (subjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="text-5xl mb-4">📚</div>
          <h3 className="font-serif text-xl font-bold text-stone-700 mb-2">No subjects yet</h3>
          <p className="text-stone-500 text-sm">Upload a textbook and question papers to get started</p>
        </div>
      </div>
    )
  }

  const subject = selectedSubject || subjects[0]

  const handleDownload = () => {
    let text = `${subject.name.toUpperCase()} — EXAM ANSWER KEY\n${'='.repeat(60)}\n\n`
    subject.combinedAnswerKey.forEach((item, i) => {
      text += `Q${i + 1}. ${item.question}\n`
      if (item.chapter) text += `[${item.chapter}${item.year ? ' | ' + item.year : ''}${item.marks ? ' | ' + item.marks + ' marks' : ''}]\n`
      text += `\nAnswer:\n${item.answer}\n\n${'─'.repeat(50)}\n\n`
    })
    downloadText(text, `${subject.name}_AnswerKey.txt`)
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 bg-stone-900 text-white overflow-y-auto">
        <div className="p-3 border-b border-stone-700">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Subjects</p>
        </div>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => { onSelectSubject(s); setActiveChapter(null) }}
            className={`w-full text-left px-3 py-3 border-b border-stone-800 transition-all ${
              subject.id === s.id ? 'bg-red-700' : 'hover:bg-stone-800'
            }`}
          >
            <div className="font-bold text-sm leading-tight">{s.name}</div>
            {s.nameHindi && <div className="text-xs text-stone-400 mt-0.5">{s.nameHindi}</div>}
            <div className="text-xs text-stone-500 mt-1">{s.chapters.length} chapters · {s.questionCount} Q&amp;As</div>
            <div className="text-xs text-stone-600 mt-0.5">{formatDate(s.createdAt)}</div>
          </button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-y-auto">
        {/* Subject header */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-800">{subject.name}</h2>
            {subject.nameHindi && <p className="text-sm text-stone-500">{subject.nameHindi}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGoToChat(subject)}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all"
            >
              🤖 Study with Bot
            </button>
            <button
              onClick={handleDownload}
              className="bg-stone-100 text-stone-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-stone-200 transition-all"
            >
              ⬇️ Download Answer Key
            </button>
          </div>
        </div>

        {/* Inner tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-0">
          {(['summaries', 'answerkey'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveInnerTab(t)}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
                activeInnerTab === t
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {t === 'summaries' ? '📖 Chapter Summaries' : '✅ Answer Key'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeInnerTab === 'summaries' && (
            <div className="space-y-3">
              {subject.chapters.map((ch, i) => (
                <ChapterCard
                  key={i}
                  chapter={ch}
                  index={i}
                  isOpen={activeChapter === i}
                  onToggle={() => setActiveChapter(activeChapter === i ? null : i)}
                />
              ))}
            </div>
          )}

          {activeInnerTab === 'answerkey' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 mb-3 font-semibold">
                {subject.combinedAnswerKey.length} questions in combined answer key
              </p>
              {subject.combinedAnswerKey.map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="bg-stone-900 text-white px-4 py-3 text-sm font-semibold flex gap-2">
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold flex-shrink-0">Q{i + 1}</span>
                    <span>{item.question}</span>
                  </div>
                  <div className="px-4 py-3 text-sm leading-relaxed text-stone-700">{item.answer}</div>
                  <div className="px-4 py-2 bg-emerald-50 text-xs font-bold text-emerald-700 flex gap-4 flex-wrap">
                    {item.chapter && <span>📖 {item.chapter}</span>}
                    {item.year && <span>📅 {item.year}</span>}
                    {item.marks && <span>🎯 {item.marks} marks</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChapterCard({ chapter, index, isOpen, onToggle }: {
  chapter: Chapter; index: number; isOpen: boolean; onToggle: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 font-serif">
            {index + 1}
          </span>
          <div>
            <div className="font-bold text-sm text-stone-800">{chapter.title}</div>
            {chapter.titleHindi && <div className="text-xs text-stone-500">{chapter.titleHindi}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-semibold hidden sm:block">
            {chapter.examHighlights?.length || 0} exam Q&amp;As
          </span>
          <span className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-stone-100 animate-fadeIn">
          {/* Summary */}
          <p className="text-sm text-stone-700 leading-relaxed mt-3 mb-3">{chapter.summary}</p>

          {/* Key concepts */}
          {chapter.keyConcepts?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Key Concepts</p>
              <div className="flex flex-wrap gap-1.5">
                {chapter.keyConcepts.map((c, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Exam highlights */}
          {chapter.examHighlights?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">📝 Exam Questions from this Chapter</p>
              <div className="space-y-2">
                {chapter.examHighlights.map((h, i) => (
                  <div key={i} className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-3 py-2">
                    <p className="text-xs font-bold text-amber-700 mb-1">Q: {h.question}</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{h.answer}</p>
                    {(h.year || h.marks) && (
                      <p className="text-xs text-stone-400 font-semibold mt-1">
                        {h.year}{h.marks ? ` · ${h.marks} marks` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
