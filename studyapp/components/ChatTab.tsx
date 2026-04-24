'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Subject, ChatMessage } from '@/lib/types'

interface Props {
  subjects: Subject[]
  initialSubject: Subject | null
}

type Mode = 'quiz' | 'evaluate' | 'chat'

export default function ChatTab({ subjects, initialSubject }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(initialSubject)
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject)
  }, [initialSubject])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const subject = selectedSubject || subjects[0]

  const toggleChapter = (title: string) => {
    setSelectedChapters(prev =>
      prev.includes(title) ? prev.filter(c => c !== title) : [...prev, title]
    )
  }

  const selectAll = () => {
    if (!subject) return
    setSelectedChapters(subject.chapters.map(c => c.title))
  }

  const buildSystemPrompt = (): string => {
    if (!subject) return ''

    const chapters = selectedChapters.length > 0
      ? subject.chapters.filter(c => selectedChapters.includes(c.title))
      : subject.chapters

    const chapterContent = chapters.map(ch => {
      const qas = ch.examHighlights?.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n') || ''
      return `## ${ch.title}\n${ch.summary}\n\nKey Concepts: ${ch.keyConcepts?.join(', ')}\n\nPast Exam Q&As:\n${qas}`
    }).join('\n\n---\n\n')

    const answerKeySnippet = subject.combinedAnswerKey
      .filter(item => selectedChapters.length === 0 || selectedChapters.includes(item.chapter))
      .slice(0, 30)
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n')

    if (mode === 'quiz') {
      return `You are an expert exam preparation tutor for the subject "${subject.name}".

Your job is to quiz the student using questions from past exam papers and chapter content.

SUBJECT CONTENT:
${chapterContent}

ANSWER KEY REFERENCE:
${answerKeySnippet}

INSTRUCTIONS:
- Ask ONE question at a time from the past papers or based on the chapter content
- After the student answers, tell them if they are correct or partially correct
- Give the model answer and explain any gaps in their answer
- Keep track of score — mention it after each answer (e.g., "Score: 3/5")
- Mix question types: MCQ, short answer, and definition questions
- Be encouraging and supportive
- After every 5 questions, offer a summary of performance
- Start by asking the first question immediately`
    }

    if (mode === 'evaluate') {
      return `You are a strict but supportive exam evaluator for the subject "${subject.name}".

SUBJECT CONTENT:
${chapterContent}

ANSWER KEY REFERENCE:
${answerKeySnippet}

INSTRUCTIONS:
- The student will write answers to questions
- You MUST evaluate their answer against the model answer
- Give a score out of the full marks (e.g., 3/4)
- Point out what they got right ✅
- Point out what is missing or incorrect ❌  
- Give the complete model answer for comparison
- Be specific and constructive
- Start by presenting a question and asking the student to answer it`
    }

    return `You are a helpful, knowledgeable study assistant for the subject "${subject.name}".

SUBJECT CONTENT:
${chapterContent}

ANSWER KEY REFERENCE:
${answerKeySnippet}

INSTRUCTIONS:
- Answer questions about the subject clearly and accurately
- Use the chapter content and answer key as your primary source
- Explain concepts simply, use examples
- If asked about topics not in the provided content, use your general knowledge but note it
- You can explain in Hindi or English based on what the student prefers
- Be encouraging and supportive
- Start with a friendly greeting and ask what the student would like to study`
  }

  const startSession = () => {
    setMessages([])
    setStarted(true)
    // Send an initial trigger message
    sendMessage('Start the session', true)
  }

  const sendMessage = async (text: string, isSystem = false) => {
    if (!text.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: text, type: mode }
    const newMessages = isSystem ? [] : [...messages, userMsg]

    if (!isSystem) {
      setMessages(prev => [...prev, userMsg])
      setInput('')
    }

    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const apiMessages = [
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
        ...(isSystem ? [] : [{ role: 'user' as const, content: text }]),
        ...(isSystem ? [{ role: 'user' as const, content: 'Please begin.' }] : []),
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt: buildSystemPrompt(),
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '⚠️ Sorry, something went wrong. Please try again.'
        }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="font-serif text-xl font-bold text-stone-700 mb-2">Study Bot ready</h3>
          <p className="text-stone-500 text-sm">Upload a subject first to start studying</p>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto">
        <h2 className="font-serif text-2xl font-bold text-stone-800 mb-1">Study Bot Setup</h2>
        <p className="text-stone-500 text-sm mb-6">Configure your study session</p>

        {/* Subject selection */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-stone-700 mb-2">Select Subject</label>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s); setSelectedChapters([]) }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  subject?.id === s.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-sm">{s.name}</div>
                <div className="text-xs text-stone-500">{s.chapters.length} chapters</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode selection */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-stone-700 mb-2">Study Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'chat', emoji: '💬', label: 'Ask & Learn', desc: 'Explain topics to me' },
              { id: 'quiz', emoji: '🎯', label: 'Quiz Me', desc: 'MCQs & short Qs' },
              { id: 'evaluate', emoji: '✍️', label: 'Evaluate Me', desc: 'Mark my answers' },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  mode === m.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className="font-bold text-xs">{m.label}</div>
                <div className="text-xs text-stone-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chapter selection */}
        {subject && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-stone-700">Select Chapters</label>
              <button onClick={selectAll} className="text-xs text-red-600 font-bold hover:underline">
                {selectedChapters.length === subject.chapters.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-stone-200 p-2">
              {subject.chapters.map((ch, i) => (
                <label key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChapters.includes(ch.title)}
                    onChange={() => toggleChapter(ch.title)}
                    className="accent-red-600"
                  />
                  <span className="text-sm text-stone-700">{ch.title}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {selectedChapters.length === 0 ? 'No selection = all chapters included' : `${selectedChapters.length} chapter${selectedChapters.length !== 1 ? 's' : ''} selected`}
            </p>
          </div>
        )}

        <button
          onClick={startSession}
          className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-md"
        >
          🚀 Start Study Session
        </button>
      </div>
    )
  }

  // Chat UI
  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Chat header */}
      <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{mode === 'quiz' ? '🎯' : mode === 'evaluate' ? '✍️' : '💬'}</span>
          <div>
            <p className="text-sm font-bold text-stone-800">{subject?.name} — {mode === 'quiz' ? 'Quiz Mode' : mode === 'evaluate' ? 'Evaluate Mode' : 'Chat Mode'}</p>
            <p className="text-xs text-stone-400">
              {selectedChapters.length > 0 ? `${selectedChapters.length} chapters` : 'All chapters'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setStarted(false); setMessages([]) }}
          className="text-xs bg-stone-100 text-stone-600 font-bold px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-all"
        >
          ⚙️ New Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-stone-800 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 mr-2">🤖</div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-red-600 text-white rounded-tr-sm'
                  : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose-chat">
                  <ReactMarkdown>{msg.content || '▋'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-stone-800 rounded-full flex items-center justify-center text-sm mr-2">🤖</div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-stone-200 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'quiz' ? 'Type your answer…' : mode === 'evaluate' ? 'Write your answer for evaluation…' : 'Ask anything about this subject…'}
            rows={2}
            disabled={streaming}
            className="flex-1 border border-stone-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="bg-stone-900 text-white rounded-xl px-4 py-3 font-bold text-sm hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            ➤
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-1 px-1">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
