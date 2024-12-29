import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'

interface TranscriptContentProps {
    summary: string
    transcript: string
}

export function TranscriptContent({ summary, transcript }: TranscriptContentProps) {
    return (
        <div className="space-y-16">
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Key Takeaways</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_strong]:font-sans">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
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