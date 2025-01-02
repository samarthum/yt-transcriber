'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthRedirect() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (loading) return

        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
        const redirectTo = searchParams.get('redirect')

        if (user && isAuthPage) {
            router.push(redirectTo || '/dashboard')
        } else if (!user && !isAuthPage && pathname !== '/') {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        }
    }, [user, loading, pathname, router, searchParams])

    return { user, loading }
} 