'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/lib/actions'
import { UserCircle } from 'lucide-react'

export function DashboardNav() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        return pathname === path ? 'text-foreground' : 'text-muted-foreground'
    }

    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="font-bold text-lg">
                        YT Transcript
                    </Link>
                    {/* <nav className="flex items-center gap-4">
                        <Link
                            href="/dashboard/app"
                            className={`text-sm hover:text-foreground transition-colors ${isActive('/dashboard/app')}`}
                        >
                            Process Video
                        </Link>
                    </nav> */}
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="/dashboard/profile"
                        className={`flex items-center gap-2 text-sm hover:text-foreground transition-colors ${isActive('/dashboard/profile')}`}
                    >
                        <UserCircle className="h-4 w-4" />
                        Profile
                    </Link>
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