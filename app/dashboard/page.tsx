import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

export default async function DashboardPage() {
    const supabase = createClient()

    const { data: transcripts } = await supabase
        .from('transcripts')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Your Transcripts</h1>
                <Button asChild>
                    <Link href="/dashboard/app">Process New Video</Link>
                </Button>
            </div>

            {transcripts && transcripts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {transcripts.map((transcript) => (
                        <Link className='p-0' key={transcript.id} href={`/dashboard/transcripts/${transcript.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow">
                                <CardHeader className="relative pb-0 p-2 md:p-4">
                                    {transcript.thumbnail_url && (
                                        <div className="aspect-video relative overflow-hidden rounded-lg">
                                            <Image
                                                src={transcript.thumbnail_url}
                                                alt={transcript.video_title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-4 px-2 md:px-4">
                                    <h3 className="font-medium line-clamp-2 mb-2">
                                        {transcript.video_title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{transcript.channel_name}</span>
                                        <span>
                                            {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                        You haven&apos;t processed any videos yet
                    </p>
                    <Button asChild>
                        <Link href="/">Process Your First Video</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}