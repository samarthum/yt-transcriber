import { AuthForm } from '@/components/auth/AuthForm'
import Link from 'next/link'

export default function RegisterPage() {
    return (
        <div className="container max-w-screen-sm py-16 font-sans">
            <div className="mb-8 space-y-6 text-center">
                <h1 className="text-3xl font-bold">Create an Account</h1>
                <p className="text-muted-foreground">
                    Sign up to save and manage your video transcripts
                </p>
            </div>

            <AuthForm type="register" />

            <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Sign in instead
                </Link>
            </p>
        </div>
    )
}
