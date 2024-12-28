import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoInfo } from "@/types/transcript"

interface VideoInfoCardProps {
    videoInfo: VideoInfo
}

export function VideoInfoCard({ videoInfo }: VideoInfoCardProps) {
    return (
        <div>
            <div className="relative aspect-video w-full mb-6">
                <img
                    src={videoInfo.thumbnailUrl}
                    alt={videoInfo.title}
                    className="object-cover w-full h-full rounded-lg"
                />
            </div>
            <h2 className="font-sans text-3xl font-semibold mb-4">{videoInfo.title}</h2>
            <div className="text-zinc-600 space-y-1">
                <p>Channel: {videoInfo.channelName}</p>
                <p>Published: {new Date(videoInfo.publishedAt).toLocaleDateString()}</p>
            </div>
        </div>
    )
} 