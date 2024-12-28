'use client'

import { useState } from 'react'
import { Alert } from "@/components/ui/alert"
import { VideoSearch } from '@/components/VideoSearch'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'
import { ProcessedTranscript } from '@/types/transcript'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessedTranscript | null>(null)

  const processTranscript = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process transcript')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-sans font-semibold text-zinc-900 mb-12 text-center">
        YouTube Transcript Processor
      </h1>

      <VideoSearch
        url={url}
        loading={loading}
        onUrlChange={setUrl}
        onSubmit={processTranscript}
      />

      {error && (
        <Alert variant="destructive" className="mb-8">
          {error}
        </Alert>
      )}

      {result && (
        <div className="space-y-16">
          <VideoInfoCard videoInfo={result.videoInfo} />
          <TranscriptContent
            summary={result.summary}
            transcript={result.structuredTranscript}
          />
        </div>
      )}
    </main>
  )
}

