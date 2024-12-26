'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ReactMarkdown from 'react-markdown'

interface TranscriptData {
  videoInfo: {
    title: string
    channelName: string
    publishedAt: string
    thumbnailUrl: string
  }
  structuredTranscript: string
  summary: string
}

interface TranscriptDisplayProps {
  structuredTranscript: string
  summary: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TranscriptData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: url }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'An error occurred while processing the transcript')
      }

      setData(result)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const TranscriptDisplay = ({ structuredTranscript, summary }: TranscriptDisplayProps) => {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
          <ReactMarkdown
            className="prose prose-blue max-w-none"
            components={{
              // Style bullet points with better spacing
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-4 space-y-4" {...props} />
              ),
              // Add spacing between bullet points
              li: ({ node, ...props }) => (
                <li className="mb-3" {...props} />
              ),
              // Ensure paragraphs have good spacing
              p: ({ node, ...props }) => (
                <p className="mb-6" {...props} />
              ),
              // Style bold text
              strong: ({ node, ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              // Style italics
              em: ({ node, ...props }) => (
                <em className="italic" {...props} />
              ),
              // Style headings
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-bold mt-4 mb-3" {...props} />
              ),
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Formatted Transcript</h2>
          <ReactMarkdown
            className="prose prose-blue max-w-none"
            components={{
              // Same component styling as above
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-4 space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-4 space-y-2" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic" {...props} />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-bold mt-4 mb-3" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4" {...props} />
              ),
            }}
          >
            {structuredTranscript}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">YouTube Transcript Processor</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Process'}
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{data.videoInfo.title}</CardTitle>
            <CardDescription>{data.videoInfo.channelName} • {new Date(data.videoInfo.publishedAt).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <img src={data.videoInfo.thumbnailUrl} alt={data.videoInfo.title} className="w-full mb-4 rounded-lg" />
            <TranscriptDisplay
              structuredTranscript={data.structuredTranscript}
              summary={data.summary}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

