'use client'

import { VideoProcessor } from './VideoProcessor'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProcessingStatus } from './ProcessingStatus'
import { VideoInfoCard } from './VideoInfoCard'
import { TranscriptContent } from './TranscriptContent'

export function VideoSearch() {
    const {
        url,
        setUrl,
        loading,
        error,
        progress,
        currentStep,
        result,
        processTranscript
    } = VideoProcessor()

    return (
        <>
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        type="text"
                        placeholder="Paste YouTube URL here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="h-11 px-4 text-base font-sans bg-muted border-input focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Button
                        onClick={processTranscript}
                        disabled={loading || !url}
                        className="h-11 px-5 font-sans text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {loading ? 'Processing...' : 'Process'}
                    </Button>
                </div>
                {error && (
                    <p className="mt-4 text-sm text-red-500">{error}</p>
                )}
            </div>

            {loading && (
                <ProcessingStatus progress={progress} currentStep={currentStep} />
            )}

            {result && (
                <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
                    <div className="space-y-8">
                        <TranscriptContent
                            summary={result.summary}
                            transcript={result.structuredTranscript}
                        />
                    </div>
                    <aside className="space-y-6">
                        <VideoInfoCard videoInfo={result.videoInfo} />
                    </aside>
                </div>
            )}
        </>
    )
} 