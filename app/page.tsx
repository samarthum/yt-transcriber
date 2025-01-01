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
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);

        // Process the streamed data
        const dataArray = chunk.split('\n\n').filter(str => str.startsWith('data:'));
        for (const dataStr of dataArray) {
          try {
            const data = JSON.parse(dataStr.substring(5)); // Remove 'data:' prefix and parse
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
            console.error('Error parsing JSON:', error);
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

