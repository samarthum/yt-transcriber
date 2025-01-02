### Database Schema

Execute these SQL commands in Supabase SQL editor:
```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transcripts table
create table transcripts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  video_id text not null,
  video_title text not null,
  channel_name text not null,
  thumbnail_url text,
  structured_content text not null,
  summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table transcripts enable row level security;

-- Create RLS policies
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Users can view own transcripts" 
  on transcripts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own transcripts" 
  on transcripts for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own transcripts" 
  on transcripts for delete 
  using (auth.uid() = user_id);

-- Create functions
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Part 2: Authentication Setup and Core Infrastructure


### 1. Create Supabase Client Utility

```typescript:lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript:lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
```


### 2. Setup Middleware

```typescript:middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in users away from auth pages
  if (session && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/api/protected/:path*'
  ],
}
```


### 3. Types Setup

```typescript:types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          user_id: string
          video_id: string
          video_title: string
          channel_name: string
          thumbnail_url: string | null
          structured_content: string
          summary: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          video_title: string
          channel_name: string
          thumbnail_url?: string | null
          structured_content: string
          summary: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          video_title?: string
          thumbnail_url?: string | null
          structured_content?: string
          summary?: string
          updated_at?: string
        }
      }
    }
  }
}
```


### 4. Auth Context Provider

```typescript:contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshProfile = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await refreshProfile()
      }
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null)
          if (session?.user) {
            await refreshProfile()
          } else {
            setProfile(null)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    initialize()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```


## Part 3: Authentication UI Components and Protected Routes


### 1. Auth Components

```typescript:components/auth/AuthForm.tsx
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
        
        // Show success message or redirect
        router.push('/login?message=Check your email to confirm your account')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Redirect to the original destination or dashboard
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{type === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
        <CardDescription>
          {type === 'login' 
            ? 'Enter your email and password to sign in' 
            : 'Create a new account to save your transcripts'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
```



### 2. Auth Pages

```typescript:app/login/page.tsx
import { AuthForm } from '@/components/auth/AuthForm'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="container max-w-screen-sm py-16">
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
    </div>
  )
}
```

```typescript:app/register/page.tsx
import { AuthForm } from '@/components/auth/AuthForm'

export default function RegisterPage() {
  return (
    <div className="container max-w-screen-sm py-16">
      <div className="mb-8 space-y-6 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          Sign up to save and manage your video transcripts
        </p>
      </div>

      <AuthForm type="register" />
    </div>
  )
}
```


### 3. Protected Dashboard Layout

```typescript:app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h2 className="text-lg font-medium">Dashboard</h2>
          <nav>
            {/* Add navigation items */}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
```


### 4. Protected API Route Example

```typescript:app/api/protected/save-transcript/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    const {
      videoId,
      videoTitle,
      channelName,
      thumbnailUrl,
      structuredContent,
      summary
    } = body

    // Save transcript
    const { data, error } = await supabase
      .from('transcripts')
      .insert({
        user_id: session.user.id,
        video_id: videoId,
        video_title: videoTitle,
        channel_name: channelName,
        thumbnail_url: thumbnailUrl,
        structured_content: structuredContent,
        summary: summary
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```


## Part 4: Dashboard Implementation and Transcript Management


### 1. Dashboard Components

```typescript:components/dashboard/TranscriptCard.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Database } from '@/types/supabase'

type Transcript = Database['public']['Tables']['transcripts']['Row']

interface TranscriptCardProps {
  transcript: Transcript
  onDelete: (id: string) => void
}

export function TranscriptCard({ transcript, onDelete }: TranscriptCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link href={`/dashboard/transcripts/${transcript.id}`}>
        <CardHeader className="relative pb-0">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            {transcript.thumbnail_url && (
              <img
                src={transcript.thumbnail_url}
                alt={transcript.video_title}
                className="object-cover w-full h-full"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <h3 className="font-medium line-clamp-2 mb-2">
            {transcript.video_title}
          </h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{transcript.channel_name}</span>
            <span>
              {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
```


### 2. Dashboard Pages

```typescript:app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { TranscriptCard } from '@/components/dashboard/TranscriptCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Transcripts</h1>
        <Button asChild>
          <Link href="/">Process New Video</Link>
        </Button>
      </div>

      {transcripts && transcripts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {transcripts.map((transcript) => (
            <TranscriptCard
              key={transcript.id}
              transcript={transcript}
              onDelete={async (id) => {
                'use server'
                const supabase = createClient()
                await supabase.from('transcripts').delete().eq('id', id)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven't processed any videos yet
          </p>
          <Button asChild>
            <Link href="/">Process Your First Video</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
```


### 3. Transcript Detail Page

```typescript:app/dashboard/transcripts/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TranscriptContent } from '@/components/TranscriptContent'
import { VideoInfoCard } from '@/components/VideoInfoCard'

export default async function TranscriptPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!transcript) {
    notFound()
  }

  const videoInfo = {
    videoId: transcript.video_id,
    title: transcript.video_title,
    channelName: transcript.channel_name,
    thumbnailUrl: transcript.thumbnail_url || '',
    publishedAt: transcript.created_at,
  }

  return (
    <div className="container max-w-screen-xl py-8">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
        <main>
          <TranscriptContent
            summary={transcript.summary}
            transcript={transcript.structured_content}
          />
        </main>
        
        <aside className="space-y-6">
          <VideoInfoCard videoInfo={videoInfo} />
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={async () => {
              'use server'
              const supabase = createClient()
              await supabase
                .from('transcripts')
                .delete()
                .eq('id', params.id)
            }}
          >
            Delete Transcript
          </Button>
        </aside>
      </div>
    </div>
  )
}
```


### 4. Update Main Page to Handle Authentication

```typescript:app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createClient()
  
  // Add authentication check
  const processTranscript = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        redirect('/login?redirect=/')
      }

      setLoading(true)
      setError(null)
      setProgress(0)
      setCurrentStep('')

      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: url }),
      })

      // ... rest of your existing processTranscript code ...

      // After processing is complete, save to database
      if (result) {
        await fetch('/api/protected/save-transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: result.videoInfo.videoId,
            videoTitle: result.videoInfo.title,
            channelName: result.videoInfo.channelName,
            thumbnailUrl: result.videoInfo.thumbnailUrl,
            structuredContent: result.structuredTranscript,
            summary: result.summary,
          }),
        })
      }
    } catch (error) {
      setError((error as Error).message)
      setLoading(false)
    }
  }

  // ... rest of your existing component code ...
}
```


### 5. Add User Profile Management

```typescript:app/dashboard/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function ProfilePage() {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single()

  async function updateProfile(formData: FormData) {
    'use server'
    
    const fullName = formData.get('fullName') as string
    const supabase = createClient()
    
    await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    redirect('/dashboard/profile?message=Profile updated')
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
      
      <form action={updateProfile} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fullName">Full Name</label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={profile.full_name || ''}
          />
        </div>

        <Button type="submit">
          Update Profile
        </Button>
      </form>
    </div>
  )
}
```


## Part 5: Error Handling, Loading States, and Final Integration


### 1. Error Boundary Component

```typescript:components/error-boundary.tsx
'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error)
  }, [error])

  return (
    <div className="container max-w-md py-16">
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```


### 2. Loading Components

```typescript:components/loading/TranscriptSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function TranscriptSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
```


### 3. Global Error Handler

```typescript:lib/error-handler.ts
import { AppError, VideoError, TranscriptError, AIServiceError } from '@/types/errors'

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Map known error types to custom errors
    if (error.message.includes('video')) {
      return new VideoError(error.message)
    }
    if (error.message.includes('transcript')) {
      return new TranscriptError(error.message)
    }
    if (error.message.includes('AI')) {
      return new AIServiceError(error.message)
    }
    
    // Generic error
    return new AppError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500
    )
  }

  // Fallback for unknown error types
  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  )
}
```


### 4. Authentication Hooks

```typescript:hooks/useAuthRedirect.ts
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
```


### 5. Rate Limiting and API Protection

```typescript:middleware.ts
// Add this to your existing middleware.ts
import { rateLimit } from '@/lib/rate-limit'

// Add rate limiting to API routes
export async function middleware(request: NextRequest) {
  // ... existing middleware code ...

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await rateLimit(ip)

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          limit,
          remaining: 0,
          reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  }

  return response
}
```


### 6. Final Integration Updates

```typescript:app/layout.tsx
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@/components/analytics'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSerif.variable}`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
```


### 7. Environment Variables Check

```typescript:lib/env-check.ts
export function checkRequiredEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'YOUTUBE_API_KEY',
    'ANTHROPIC_API_KEY'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
```


### 8. Update package.json Scripts

```json:package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "prepare": "husky install"
  }
}
```