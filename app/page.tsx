'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Youtube, ChevronRight } from 'lucide-react'
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

function extractHeadings(transcript: string) {
  // Find both level-2 (##) and level-3 (###) headings
  // Each match captures the hashes (group 1) and the heading text (group 2)
  const headingRegex = /^(#{2,3})\s+(.*)$/gm
  const headings = []
  let match

  while ((match = headingRegex.exec(transcript)) !== null) {
    const level = match[1].length // 2 for "##", 3 for "###"
    const text = match[2].trim()
    // Simple slug generation
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    headings.push({ level, text, slug })
  }

  return headings
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
      const errorMessage = err instanceof Error
        ? err.message
        : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const TranscriptDisplay = ({ structuredTranscript, summary }: TranscriptDisplayProps) => {
    // Identify headings for the table of contents
    const headings = extractHeadings(structuredTranscript)

    return (
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table of Contents */}
        <aside className="lg:w-1/4 space-y-4" aria-label="Table of Contents">
          <h2 className="text-xl font-bold">Table of Contents</h2>
          <ul className="space-y-2">
            {headings.map((heading, index) => {
              const indentClass = heading.level === 3 ? 'ml-5' : 'ml-2'
              return (
                <li key={index} className={indentClass}>
                  <a href={`#${heading.slug}`} className="hover:underline">
                    {heading.level === 3 ? `• ${heading.text}` : heading.text}
                  </a>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Main transcript area */}
        <div className="lg:w-3/4 space-y-8">
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                className="prose prose-neutral dark:prose-invert max-w-none"
                components={{
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc space-y-2 pl-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-gray-700 dark:text-gray-300" {...props} />
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 px-2">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Formatted Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {structuredTranscript
                .split(/(?=## )/g)
                .map((section, index) => {
                  if (!section.trim()) return null;

                  const [title, ...content] = section.split('\n')
                  // Create a slug to match the table of contents
                  const headingSlug = title
                    .replace(/^#+\s*/, '')
                    .trim()
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')

                  return (
                    <details key={index} className="group border-0" open>
                      <summary
                        id={headingSlug}
                        className="flex items-center gap-2 text-xl font-bold cursor-pointer text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 py-2"
                      >
                        <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                        {title.replace(/^#+\s*/, '')}
                      </summary>
                      <div className="pl-4">
                        <ReactMarkdown
                          className="prose prose-neutral dark:prose-invert max-w-none [&>ol]:!mt-0 [&>ul]:!mt-0 [&>p]:!mb-0 [&>ol>li]:!mb-0 [&>ul>li]:!mb-0"
                          components={{
                            h3: ({ node, ...props }) => (
                              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-300" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="text-gray-600 dark:text-gray-400" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc pl-4 [&>li]:!mb-0" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="list-decimal pl-4 [&>li]:!mb-0" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="text-gray-700 dark:text-gray-300 leading-relaxed py-0.5 !mb-0" {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
                            ),
                            em: ({ node, ...props }) => (
                              <em className="text-gray-800 dark:text-gray-200 italic" {...props} />
                            ),
                          }}
                        >
                          {content.join('\n')}
                        </ReactMarkdown>
                      </div>
                    </details>
                  )
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
            YouTube Transcript Processor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform YouTube video transcripts into well-structured, readable content
          </p>
        </div>

        <Card className="mb-8 border-2 border-gray-100 dark:border-gray-800">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Youtube className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL here"
                  className="pl-10 bg-transparent"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 dark:text-gray-900 hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-8">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="aspect-video w-full">
                <img
                  src={data.videoInfo.thumbnailUrl}
                  alt={data.videoInfo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{data.videoInfo.title}</CardTitle>
                <CardDescription>
                  {data.videoInfo.channelName} • {new Date(data.videoInfo.publishedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>

            <TranscriptDisplay
              structuredTranscript={data.structuredTranscript}
              summary={data.summary}
            />
          </div>
        )}
      </div>
    </main>
  )
}

