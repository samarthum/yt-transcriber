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
            { rootMargin: '-20% 0% -60% 0%' }
        )

        // Observe all section elements
        headings.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [headings])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            // Get the header height (assuming it's 64px, adjust if different)
            const headerHeight = 64
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 24

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
            setActiveId(id)
        }
    }

    return (
        <nav className="space-y-1 font-sans">
            <p className="font-medium mb-4 text-sm">Table of Contents</p>
            {headings.map(({ id, text, level }) => (
                <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                        'block w-full text-left px-2 py-1.5 text-sm transition-colors rounded-sm',
                        level === 3 && 'pl-4',
                        activeId === id
                            ? 'text-foreground font-medium bg-muted'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                >
                    {text}
                </button>
            ))}
        </nav>
    )
} 