'use client'

import { useVideoProcessor } from './VideoProcessor'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProcessingStatus } from './ProcessingStatus'

export function VideoSearch() {
    const {
        url,
        setUrl,
        loading,
        error,
        progress,
        currentStep,
        isRedirecting,
        processTranscript
    } = useVideoProcessor()

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
                        disabled={isRedirecting}
                    />
                    <Button
                        onClick={processTranscript}
                        disabled={loading || !url || isRedirecting}
                        className="h-11 px-5 font-sans text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {loading ? 'Processing...' : isRedirecting ? 'Redirecting...' : 'Process'}
                    </Button>
                </div>
                {error && (
                    <p className="mt-4 text-sm text-red-500">{error}</p>
                )}
            </div>

            {(loading || isRedirecting) && (
                <ProcessingStatus progress={progress} currentStep={currentStep} />
            )}
        </>
    )
} 