import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'
import { TableOfContents } from '@/components/TableOfContents'
import { extractHeadings } from '@/lib/textUtils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function TranscriptPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = createClient()

    const { data: transcript } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!transcript) {
        notFound()
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
        <div className="container max-w-screen-xl px-0 sm:px-4 py-4 sm:py-8">
            <div className="mb-8 px-2 sm:px-0">
                <Button variant="outline" asChild>
                    <Link href="/dashboard">← Back to Dashboard</Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:gap-8 lg:grid-cols-[220px,1fr,300px]">
                <div className="hidden lg:block">
                    <div className="sticky top-8">
                        <TableOfContents headings={headings} />
                    </div>
                </div>
                <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
                    <TranscriptContent
                        summary={transcript.summary}
                        transcript={transcript.structured_content}
                    />
                </div>
                <aside className="space-y-6 px-2 sm:px-0">
                    <div className="sticky top-8">
                        <VideoInfoCard videoInfo={videoInfo} />
                    </div>
                </aside>
            </div>
        </div>
    )
}