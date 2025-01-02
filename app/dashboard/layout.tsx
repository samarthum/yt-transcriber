import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/DashboardNav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen flex-col font-sans">
            <DashboardNav />
            <main className="flex-1">
                <div className="container py-6 px-6 md:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}