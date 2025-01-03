'use client'

import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { VideoInfo } from "@/types/transcript"
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VideoInfoCardProps {
    videoInfo: VideoInfo
}

export function VideoInfoCard({ videoInfo }: VideoInfoCardProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse">
                    <div className="aspect-video w-full bg-muted mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                </div>
            </Card>
        )
    }

    if (!user) {
        return (
            <Card className="p-6">
                <p className="text-center mb-4">Please sign in to view video details</p>
                <Button asChild className="w-full">
                    <Link href="/login">Sign In</Link>
                </Button>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden">
            {videoInfo.thumbnailUrl && (
                <div className="aspect-video relative">
                    <Image
                        src={videoInfo.thumbnailUrl}
                        alt={videoInfo.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                        priority
                    />
                </div>
            )}
            <div className='p-3'>
                <h1 className="text-xl font-medium text-foreground mb-3">
                    {videoInfo.title}
                </h1>
                <div className="text-sm text-muted-foreground space-y-1">
                    <p>Channel: {videoInfo.channelName}</p>
                    <p>Published: {new Date(videoInfo.publishedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </Card>
    )
} 