'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/lib/actions'

export function DashboardNav() {
    const pathname = usePathname()

    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="font-bold text-lg">
                        YT Transcript
                    </Link>
                    {pathname !== '/dashboard/app' && (
                        <Link
                            href="/dashboard/app"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            Process Video
                        </Link>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <form action={signOut}>
                        <Button variant="outline" size="sm">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
} 