'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthFormProps {
    type: 'login' | 'register'
}

export function AuthForm({ type }: AuthFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const message = searchParams.get('message')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (type === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                })
                if (error) throw error

                router.push('/login?message=Check your email to confirm your account')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                const redirectTo = searchParams.get('redirect') || '/dashboard'
                router.push(redirectTo)
            }
        } catch (error) {
            setError((error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto font-sans">
            <CardHeader>
                <CardTitle className="font-sans">{type === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
                <CardDescription className="font-sans">
                    {type === 'login'
                        ? 'Enter your email and password to sign in'
                        : 'Create a new account to save your transcripts'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {message && (
                    <Alert className="mb-8">
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'register' && (
                        <div className="space-y-2">
                            <label htmlFor="fullName">Full Name</label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password">Password</label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Loading...' : type === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}