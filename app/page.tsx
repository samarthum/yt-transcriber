'use client'

import { useState } from 'react'
import { Alert } from "@/components/ui/alert"
import { VideoSearch } from '@/components/VideoSearch'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'
import { ProcessedTranscript } from '@/types/transcript'
import { Sidebar } from '@/components/Sidebar'
import { Menu as MenuIcon, X as XIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessedTranscript | null>(null)
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {result && (
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar - Hidden on mobile by default */}
          <div className="hidden lg:block w-72 h-screen fixed left-0 top-0 border-r border-border bg-background">
            <div className="h-full p-5 flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-sm font-medium">
                  Contents
                </h1>
                <ThemeToggle />
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  transcript={result.structuredTranscript}
                  summary={result.summary}
                  onSectionClick={scrollToSection}
                />
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <h1 className="text-sm font-medium">Contents</h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-72 bg-background shadow-lg z-50 transform transition-transform duration-200 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}>
              <div className="absolute top-0 left-0 right-0 p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">Contents</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="h-full overflow-y-auto pt-20 px-4 pb-6">
                <Sidebar
                  transcript={result.structuredTranscript}
                  summary={result.summary}
                  onSectionClick={(id) => {
                    scrollToSection(id);
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            </div>
          </>

          {/* Main Content */}
          <div className="flex-1 lg:ml-72 pt-14 lg:pt-0">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-12 lg:py-16">
              {error && (
                <Alert variant="destructive" className="mb-8">
                  {error}
                </Alert>
              )}

              {loading && (
                <div className="mb-12 px-6 py-8 bg-muted rounded-lg border border-border">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground">
                        {currentStep || 'Processing video...'}
                      </h3>
                      <span className="text-sm font-medium text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out animate-progress"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-12">
                <VideoInfoCard videoInfo={result.videoInfo} />
                <TranscriptContent
                  summary={result.summary}
                  transcript={result.structuredTranscript}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial state (no result) */}
      {!result && (
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-6 lg:py-12">
          <h1 className="text-3xl lg:text-4xl font-sans font-semibold text-foreground mb-6 lg:mb-12 text-center">
            YouTube Transcript Processor
          </h1>
          <VideoSearch
            url={url}
            loading={loading}
            onUrlChange={setUrl}
            onSubmit={processTranscript}
          />
          {loading && (
            <div className="mt-8 px-6 py-8 bg-muted rounded-lg border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {currentStep || 'Processing video...'}
                  </h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out animate-progress"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

