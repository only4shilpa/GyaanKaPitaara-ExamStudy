'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { fileToBase64, generateId } from '@/lib/utils'
import type { Subject } from '@/lib/types'

interface Props {
  onSubjectReady: (subject: Subject) => void
}

type UploadFile = { file: File; name: string }

const STEPS = [
  'Reading your PDFs…',
  'Identifying chapters…',
  'Analysing question papers…',
  'Mapping questions to chapters…',
  'Generating summaries…',
  'Building answer key…',
  'Finalising study guide…',
]

export default function UploadTab({ onSubjectReady }: Props) {
  const [subjectName, setSubjectName] = useState('')
  const [textbooks, setTextbooks] = useState<UploadFile[]>([])
  const [papers, setPapers] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [error, setError] = useState('')

  const onDropBooks = useCallback((files: File[]) => {
    setTextbooks(prev => [
      ...prev,
      ...files
        .filter(f => !prev.find(p => p.name === f.name))
        .map(f => ({ file: f, name: f.name }))
    ])
  }, [])

  const onDropPapers = useCallback((files: File[]) => {
    setPapers(prev => [
      ...prev,
      ...files
        .filter(f => !prev.find(p => p.name === f.name))
        .map(f => ({ file: f, name: f.name }))
    ])
  }, [])

  const bookZone = useDropzone({ onDrop: onDropBooks, accept: { 'application/pdf': ['.pdf'] }, multiple: true })
  const paperZone = useDropzone({ onDrop: onDropPapers, accept: { 'application/pdf': ['.pdf'] }, multiple: true })

  const canAnalyse = subjectName.trim() && textbooks.length > 0 && papers.length > 0 && !loading

  const animateProgress = (target: number, stepIndex: number) => {
    setProgress(target)
    setStepIdx(stepIndex)
  }

  const handleAnalyse = async () => {
    setLoading(true)
    setError('')
    setProgress(5)
    setStepIdx(0)

    try {
      animateProgress(15, 1)
      const tbData = await Promise.all(
        textbooks.map(async t => ({ name: t.name, data: await fileToBase64(t.file) }))
      )
      animateProgress(25, 2)
      const qpData = await Promise.all(
        papers.map(async p => ({ name: p.name, data: await fileToBase64(p.file) }))
      )
      animateProgress(40, 3)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName, textbooks: tbData, questionPapers: qpData }),
      })

      animateProgress(80, 5)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const json = await res.json()
      animateProgress(100, 6)

      const subject: Subject = {
        id: generateId(),
        name: subjectName,
        nameHindi: json.data.subjectNameHindi,
        createdAt: new Date().toISOString(),
        chapters: json.data.chapters || [],
        combinedAnswerKey: json.data.combinedAnswerKey || [],
        questionCount: (json.data.combinedAnswerKey || []).length,
      }

      setTimeout(() => {
        onSubjectReady(subject)
        setLoading(false)
        setSubjectName('')
        setTextbooks([])
        setPapers([])
        setProgress(0)
      }, 600)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold text-stone-800">Upload Study Materials</h2>
        <p className="text-stone-500 text-sm mt-1">Add a textbook and past question papers — AI will generate chapter summaries and an answer key</p>
      </div>

      {/* Subject Name */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-stone-700 mb-2">Subject Name</label>
        <input
          type="text"
          value={subjectName}
          onChange={e => setSubjectName(e.target.value)}
          placeholder="e.g. Home Science, Mathematics, Physics…"
          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          disabled={loading}
        />
      </div>

      {/* Upload zones */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Textbooks */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">📖 Textbook PDFs</label>
          <div
            {...bookZone.getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              bookZone.isDragActive
                ? 'border-red-400 bg-red-50'
                : 'border-stone-300 hover:border-red-300 hover:bg-red-50/50 bg-white'
            }`}
          >
            <input {...bookZone.getInputProps()} disabled={loading} />
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm font-semibold text-stone-600">Drop PDFs here</p>
            <p className="text-xs text-stone-400 mt-1">or click to browse</p>
          </div>
          {textbooks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {textbooks.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {f.name.length > 22 ? f.name.slice(0, 20) + '…' : f.name}
                  <button onClick={() => setTextbooks(prev => prev.filter((_, j) => j !== i))} className="text-amber-600 hover:text-red-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Question Papers */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">📝 Past Question Papers</label>
          <div
            {...paperZone.getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              paperZone.isDragActive
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-stone-300 hover:border-emerald-300 hover:bg-emerald-50/50 bg-white'
            }`}
          >
            <input {...paperZone.getInputProps()} disabled={loading} />
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-semibold text-stone-600">Drop PDFs here</p>
            <p className="text-xs text-stone-400 mt-1">Multiple years supported</p>
          </div>
          {papers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {papers.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {f.name.length > 22 ? f.name.slice(0, 20) + '…' : f.name}
                  <button onClick={() => setPapers(prev => prev.filter((_, j) => j !== i))} className="text-emerald-600 hover:text-red-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {loading && (
        <div className="mb-6 bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex justify-between text-sm font-semibold text-stone-700 mb-2">
            <span>{STEPS[stepIdx]}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs ${i < stepIdx ? 'text-emerald-600' : i === stepIdx ? 'text-stone-800 font-semibold' : 'text-stone-300'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? 'bg-amber-500 animate-pulse' : 'bg-stone-200'}`} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* Analyse Button */}
      <button
        onClick={handleAnalyse}
        disabled={!canAnalyse}
        className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {loading ? '⏳ Analysing…' : '🔍 Analyse & Generate Study Guide'}
      </button>

      <p className="text-center text-xs text-stone-400 mt-3">
        Analysis typically takes 30–90 seconds depending on PDF size
      </p>
    </div>
  )
}
