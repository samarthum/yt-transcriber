import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'

interface TranscriptContentProps {
    summary: string
    transcript: string
}

export function TranscriptContent({ summary, transcript }: TranscriptContentProps) {
    return (
        <div className="space-y-16">
            <section className="border-[1px] p-8 rounded-lg">
                <h2 className="section-title">Key Takeaways</h2>
                <div className="prose [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_strong]:font-sans">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
            </section>

            <section>
                <h2 className="section-title">Full Transcript</h2>
                <div className="prose [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_strong]:font-sans">
                    <ReactMarkdown>{transcript}</ReactMarkdown>
                </div>
            </section>
        </div>
    )
} 