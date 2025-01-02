import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import Link from 'next/link'

export default function LoginPage() {
    return (
        <div className="container max-w-screen-sm py-16 font-sans">
            <div className="mb-8 space-y-6 text-center">
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="text-muted-foreground">
                    Sign in to your account to access your saved transcripts
                </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <AuthForm type="login" />
            </Suspense>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                    Create one now
                </Link>
            </p>
        </div>
    )
}