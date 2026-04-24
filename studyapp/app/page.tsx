'use client'

import { useState } from 'react'
import UploadTab from '@/components/UploadTab'
import SummaryTab from '@/components/SummaryTab'
import ChatTab from '@/components/ChatTab'
import type { Subject } from '@/lib/types'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'summaries' | 'chat'>('upload')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  const addSubject = (subject: Subject) => {
    setSubjects(prev => {
      const exists = prev.find(s => s.id === subject.id)
      if (exists) return prev.map(s => s.id === subject.id ? subject : s)
      return [...prev, subject]
    })
    setSelectedSubject(subject)
    setActiveTab('summaries')
  }

  const tabs = [
    { id: 'upload', label: '📤 Upload', desc: 'Add new subject' },
    { id: 'summaries', label: '📖 Summaries', desc: `${subjects.length} subject${subjects.length !== 1 ? 's' : ''}` },
    { id: 'chat', label: '🤖 Study Bot', desc: 'Quiz & evaluate' },
  ] as const

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-0.5">AI-Powered</div>
          <h1 className="font-serif text-2xl font-bold leading-none">
            Exam<span className="text-amber-400">Ready</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 font-semibold">
            हिंदी + English
          </span>
          {subjects.length > 0 && (
            <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-3 py-1 font-semibold">
              {subjects.length} Subject{subjects.length !== 1 ? 's' : ''} Loaded
            </span>
          )}
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-stone-200 px-4 flex gap-1 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs font-normal ${activeTab === tab.id ? 'text-red-400' : 'text-stone-300'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'upload' && (
          <UploadTab onSubjectReady={addSubject} />
        )}
        {activeTab === 'summaries' && (
          <SummaryTab
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
            onGoToChat={(subject) => { setSelectedSubject(subject); setActiveTab('chat') }}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            subjects={subjects}
            initialSubject={selectedSubject}
          />
        )}
      </main>
    </div>
  )
}
