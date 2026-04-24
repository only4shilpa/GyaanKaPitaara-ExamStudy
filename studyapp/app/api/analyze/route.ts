import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subjectName, textbooks, questionPapers } = body

    if (!subjectName || !textbooks?.length || !questionPapers?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const contentParts: Anthropic.MessageParam['content'] = []

    contentParts.push({
      type: 'text',
      text: `You are an expert educational assistant. Analyze the following textbook(s) and past exam question papers for the subject: "${subjectName}". The materials may be in Hindi, English, or both.`
    })

    for (let i = 0; i < textbooks.length; i++) {
      contentParts.push({ type: 'text', text: `TEXTBOOK #${i + 1}: "${textbooks[i].name}"` })
      contentParts.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: textbooks[i].data }
      } as any)
    }

    for (let i = 0; i < questionPapers.length; i++) {
      contentParts.push({ type: 'text', text: `QUESTION PAPER #${i + 1}: "${questionPapers[i].name}"` })
      contentParts.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: questionPapers[i].data }
      } as any)
    }

    contentParts.push({
      type: 'text',
      text: `Analyze all documents thoroughly and return ONLY a valid JSON object (no markdown, no backticks, no extra text) with this exact structure:

{
  "subjectNameHindi": "Subject name in Hindi if applicable, else empty string",
  "chapters": [
    {
      "title": "Chapter name in original language",
      "titleHindi": "Hindi title if applicable",
      "summary": "Comprehensive 150-200 word summary of this chapter covering all key topics",
      "keyConcepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
      "examHighlights": [
        {
          "question": "Exact question from question papers related to this chapter",
          "answer": "Complete exam-ready answer in 3-6 sentences",
          "year": "Year from paper header if identifiable, else 'Previous Year'",
          "marks": "Mark value if visible, else empty string"
        }
      ]
    }
  ],
  "combinedAnswerKey": [
    {
      "chapter": "Chapter name",
      "question": "Full question text",
      "answer": "Full detailed answer",
      "year": "Year",
      "marks": "Marks"
    }
  ]
}

Rules:
- Identify ALL chapters from the textbook
- Map EVERY question from EVERY question paper to its relevant chapter
- Answers must be complete and exam-ready
- Respond in the same language(s) as the source material
- Return ONLY the JSON object, nothing else`
    })

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentParts }]
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')

    const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    console.error('Analyze error:', err)
    return NextResponse.json(
      { error: err.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
