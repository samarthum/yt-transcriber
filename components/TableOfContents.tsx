'use client'

import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface Heading {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    headings: Heading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '0% 0% -80% 0%' }
        )

        headings.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [headings])

    return (
        <nav className="space-y-1 font-sans">
            <p className="font-medium mb-4 text-sm">Table of Contents</p>
            {headings.map(({ id, text, level }) => (
                <a
                    key={id}
                    href={`#${id}`}
                    className={cn(
                        'block text-sm py-1 text-muted-foreground hover:text-foreground transition-colors',
                        {
                            'text-foreground font-medium': activeId === id,
                            'pl-4': level === 3,
                            'pl-6': level === 4,
                        }
                    )}
                    onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(id)?.scrollIntoView({
                            behavior: 'smooth'
                        })
                    }}
                >
                    {text}
                </a>
            ))}
        </nav>
    )
} 