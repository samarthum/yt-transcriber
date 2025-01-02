import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoInfo } from "@/types/transcript"

interface VideoInfoCardProps {
    videoInfo: VideoInfo
}

export function VideoInfoCard({ videoInfo }: VideoInfoCardProps) {
    return (
        <div>
            <div className="relative aspect-video w-full mb-6 lg:mb-8">
                <img
                    src={videoInfo.thumbnailUrl}
                    alt={videoInfo.title}
                    className="object-cover w-full h-full rounded-lg"
                />
            </div>
            <h1 className="text-2xl lg:text-3xl font-medium tracking-tight text-zinc-900 mb-3 lg:mb-4">
                {videoInfo.title}
            </h1>
            <div className="text-sm text-zinc-600 space-y-1">
                <p>Channel: {videoInfo.channelName}</p>
                <p>Published: {new Date(videoInfo.publishedAt).toLocaleDateString()}</p>
            </div>
        </div>
    )
} 