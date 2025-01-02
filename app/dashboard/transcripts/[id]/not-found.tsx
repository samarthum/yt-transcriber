import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Transcript Not Found</h2>
            <p className="text-muted-foreground mb-8">
                The transcript you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    )
} 