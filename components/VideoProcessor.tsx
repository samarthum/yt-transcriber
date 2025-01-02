'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProcessedTranscript } from '@/types/transcript'

export function VideoProcessor() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [result, setResult] = useState<ProcessedTranscript | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const processTranscript = async () => {
        try {
            setLoading(true)
            setError(null)
            setProgress(0)
            setCurrentStep('Starting process...')
            setResult(null)

            const response = await fetch('/api/process-transcript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl: url }),
            })

            if (!response.ok) {
                throw new Error('Failed to process transcript')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            let finalResult: ProcessedTranscript | null = null
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += new TextDecoder().decode(value)
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line) continue
                    if (!line.startsWith('data: ')) continue

                    try {
                        const data = JSON.parse(line.slice(5))
                        console.log('Received data:', data)

                        if (data.progress) {
                            setProgress(data.progress)
                            setCurrentStep(data.step)
                        }
                        // Check if this is the final data with transcript
                        if (data.structuredTranscript && data.summary && data.videoInfo) {
                            finalResult = {
                                structuredTranscript: data.structuredTranscript,
                                summary: data.summary,
                                videoInfo: data.videoInfo
                            }
                            setResult(finalResult)
                        }
                    } catch (e) {
                        console.error('Error parsing line:', line, e)
                    }
                }
            }

            if (!finalResult) {
                console.error('No final result received')
                throw new Error('No result received')
            }

            console.log('Saving to Supabase:', finalResult)

            // Save to Supabase
            const { error: saveError } = await supabase
                .from('transcripts')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    video_id: finalResult.videoInfo.videoId,
                    video_title: finalResult.videoInfo.title,
                    channel_name: finalResult.videoInfo.channelName,
                    thumbnail_url: finalResult.videoInfo.thumbnailUrl,
                    structured_content: finalResult.structuredTranscript,
                    summary: finalResult.summary,
                })

            if (saveError) throw saveError

            // Wait a moment to show the result before redirecting
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (error) {
            console.error('Processing error:', error)
            setError((error as Error).message)
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
        result,
        processTranscript,
    }
} 