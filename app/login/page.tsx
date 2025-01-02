import { AuthForm } from '@/components/auth/AuthForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="container max-w-screen-sm py-16 font-sans">
            <div className="mb-8 space-y-6 text-center">
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="text-muted-foreground">
                    Sign in to your account to access your saved transcripts
                </p>
            </div>

            {searchParams?.message && (
                <Alert className="mb-8">
                    <AlertDescription>{searchParams.message}</AlertDescription>
                </Alert>
            )}

            <AuthForm type="login" />

            <p className="mt-8 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                    Create one now
                </Link>
            </p>
        </div>
    )
}