'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProcessingStatus } from '@/components/ProcessingStatus'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'
import { VideoError, DatabaseError } from '@/lib/errors'
import type { ProcessingResult, ProcessingUpdate } from '@/types/transcript'

export function useVideoProcessor() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [result, setResult] = useState<ProcessingResult | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const processTranscript = async () => {
        try {
            setLoading(true)
            setError(null)
            setProgress(0)
            setCurrentStep('Starting...')

            if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
                throw new VideoError('Please enter a valid YouTube URL')
            }

            const response = await fetch('/api/process-transcript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl: url }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to process video')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('Failed to start processing')

            // Process streaming response
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const text = new TextDecoder().decode(value)
                const lines = text.split('\n').filter(Boolean)

                for (const line of lines) {
                    const data = JSON.parse(line.replace('data: ', '')) as ProcessingUpdate

                    if (data.error) {
                        throw new Error(data.error)
                    }

                    setProgress(data.progress || 0)
                    setCurrentStep(data.step || '')

                    if (data.done) {
                        if (data.videoInfo && data.structuredTranscript && data.summary) {
                            const processedResult = data as ProcessingResult;
                            setResult(processedResult)

                            // Save to Supabase immediately after getting the result
                            const { data: savedTranscript, error: saveError } = await supabase
                                .from('transcripts')
                                .insert({
                                    user_id: (await supabase.auth.getUser()).data.user?.id,
                                    video_id: processedResult.videoInfo.videoId,
                                    video_title: processedResult.videoInfo.title,
                                    channel_name: processedResult.videoInfo.channelName,
                                    thumbnail_url: processedResult.videoInfo.thumbnailUrl,
                                    structured_content: processedResult.structuredTranscript,
                                    summary: processedResult.summary,
                                })
                                .select()
                                .single()

                            if (saveError) {
                                throw new DatabaseError('Failed to save transcript')
                            }

                            // Show redirecting state
                            setIsRedirecting(true)
                            setCurrentStep('Redirecting to transcript...')

                            // Redirect using the database ID
                            setTimeout(() => {
                                router.push(`/dashboard/transcripts/${savedTranscript.id}`)
                            }, 2000)
                        }
                        break
                    }
                }
            }

        } catch (error) {
            console.error('Processing error:', error)
            setError(error instanceof Error ? error.message : 'An unexpected error occurred')
            setIsRedirecting(false)
        } finally {
            setLoading(false)
        }
    }

    return {
        url,
        setUrl,
        loading,
        error,
        progress,
        currentStep,
        isRedirecting,
        result,
        processTranscript
    }
} 