import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { SubmitButton } from '@/components/profile/SubmitButton'

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: { message?: string; error?: string }
}) {
    const supabase = createClient()

    // Fetch profile with error handling
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .single()

    if (profileError) {
        return (
            <div className="max-w-xl mx-auto">
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        Failed to load profile: {profileError.message}
                    </AlertDescription>
                </Alert>
                <Button asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        )
    }

    if (!profile) {
        redirect('/login')
    }

    async function updateProfile(formData: FormData) {
        'use server'

        const fullName = formData.get('fullName') as string
        if (!fullName?.trim()) {
            redirect('/dashboard/profile?error=Name cannot be empty')
        }

        const supabase = createClient()
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

        if (updateError) {
            redirect('/dashboard/profile?error=' + updateError.message)
        }

        redirect('/dashboard/profile?message=Profile updated successfully')
    }

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

            {searchParams?.message && (
                <Alert className="mb-6">
                    <AlertDescription>{searchParams.message}</AlertDescription>
                </Alert>
            )}

            {searchParams?.error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{searchParams.error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium">
                                Full Name
                            </label>
                            <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                defaultValue={profile.full_name || ''}
                                placeholder="Enter your full name"
                                required
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}