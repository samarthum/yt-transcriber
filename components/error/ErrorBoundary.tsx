'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ErrorBoundary({
    error,
    reset,
}: ErrorBoundaryProps) {
    return (
        <div className="container max-w-xl py-16">
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Something went wrong!</AlertTitle>
                <AlertDescription>
                    {error.message || 'An unexpected error occurred'}
                </AlertDescription>
            </Alert>

            <div className="flex gap-4">
                <Button onClick={reset}>
                    Try again
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
} 