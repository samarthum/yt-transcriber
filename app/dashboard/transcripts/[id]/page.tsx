import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'
import { TableOfContents } from '@/components/TableOfContents'
import { extractHeadings } from '@/lib/textUtils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AppError, TranscriptError, DatabaseError } from '@/lib/errors'

export default async function TranscriptPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = createClient()

    try {
        const { data: transcript, error } = await supabase
            .from('transcripts')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) {
            throw new DatabaseError(`Failed to load transcript: ${error.message}`)
        }

        if (!transcript) {
            throw new TranscriptError('Transcript not found')
        }

        const videoInfo = {
            videoId: transcript.video_id,
            title: transcript.video_title,
            channelName: transcript.channel_name,
            thumbnailUrl: transcript.thumbnail_url,
            publishedAt: new Date().toISOString(),
        }

        const headings = extractHeadings(transcript.structured_content)

        return (
            <div className="max-w-full md:max-w-screen-xl px-0 sm:px-4 py-4 sm:py-8">
                <div className="mb-8 px-0 md:px-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">← Back to Dashboard</Link>
                    </Button>
                </div>

                <div className="px-0 grid gap-4 sm:gap-8 lg:grid-cols-[220px,1fr,300px]">
                    <div className="hidden lg:block">
                        <div className="sticky top-8">
                            <TableOfContents headings={headings} />
                        </div>
                    </div>
                    <div className="space-y-6 sm:space-y-8 px-0 sm:px-2">
                        <TranscriptContent
                            summary={transcript.summary}
                            transcript={transcript.structured_content}
                        />
                    </div>
                    <aside className="space-y-6 px-0">
                        <div className="sticky top-8">
                            <VideoInfoCard videoInfo={videoInfo} />
                        </div>
                    </aside>
                </div>
            </div>
        )
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }
        throw new DatabaseError('Failed to load transcript')
    }
}