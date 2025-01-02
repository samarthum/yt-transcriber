import { VideoSearch } from '@/components/VideoSearch'
import { ProcessingStatus } from '@/components/ProcessingStatus'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { TranscriptContent } from '@/components/TranscriptContent'

export default function ProcessPage() {
    return (
        <div className="container py-8 max-w-screen-xl">
            <div className="max-w-screen-lg mx-auto">
                <VideoSearch />
            </div>

            <div id="result" className="mt-12">
                <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
                    <div className="space-y-8">
                        {/* Processing status and transcript content will be rendered here */}
                    </div>
                    <aside className="space-y-6">
                        {/* Video info will be rendered here */}
                    </aside>
                </div>
            </div>
        </div>
    )
} 