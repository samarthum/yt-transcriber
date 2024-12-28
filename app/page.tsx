'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import ReactMarkdown from 'react-markdown'

interface VideoInfo {
  videoId: string
  title: string
  channelName: string
  publishedAt: string
  thumbnailUrl: string
}

interface ProcessedTranscript {
  videoInfo: VideoInfo
  structuredTranscript: string
  summary: string
}

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
    <main className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">
        YouTube Transcript Processor
      </h1>

      <div className="flex gap-4 mb-8">
        <Input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={processTranscript}
          disabled={loading || !url}
        >
          {loading ? 'Processing...' : 'Process'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          {error}
        </Alert>
      )}

      {result && (
        <div className="space-y-8">
          {/* Video Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{result.videoInfo.title}</CardTitle>
              <div className="flex gap-4 mt-4">
                <img
                  src={result.videoInfo.thumbnailUrl}
                  alt={result.videoInfo.title}
                  className="w-48 rounded-lg"
                />
                <div>
                  <p className="text-sm text-gray-600">
                    Channel: {result.videoInfo.channelName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Published: {new Date(result.videoInfo.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <div className="prose dark:prose-invert max-w-none mt-4">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </CardHeader>
          </Card>

          {/* Transcript Section */}
          <Card>
            <CardHeader>
              <CardTitle>Structured Transcript</CardTitle>
              <div className="prose dark:prose-invert max-w-none mt-4">
                <ReactMarkdown>{result.structuredTranscript}</ReactMarkdown>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </main>
  )
}

