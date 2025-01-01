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
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const processTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setCurrentStep('');

      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: url }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to process transcript');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // Add buffer for incomplete chunks

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split buffer into complete messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep last incomplete chunk in buffer

        // Process complete messages
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              if (data.step) {
                setCurrentStep(data.step);
              }
              if (data.done) {
                setResult(data);
                setLoading(false);
              }
            } catch (error) {
              console.warn('Error parsing chunk:', error);
              // Continue processing other chunks even if one fails
              continue;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-12">
      <h1 className="text-4xl font-sans font-semibold text-zinc-900 mb-6 md:mb-12 text-center">
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

      {loading && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">Processing...</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {currentStep && (
            <p className="mt-2 text-sm text-gray-500">
              {currentStep}
            </p>
          )}
        </div>
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

