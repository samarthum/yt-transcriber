import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'

interface TranscriptContentProps {
    summary: string
    transcript: string
}

export function TranscriptContent({ summary, transcript }: TranscriptContentProps) {
    return (
        <div className="space-y-12 lg:space-y-16">
            <section id="key-takeaways">
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg lg:text-xl font-medium text-foreground">Key Takeaways</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-zinc prose-sm dark:prose-invert [&>*:first-child]:mt-0">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="transcript-content">
                <div className="prose prose-zinc prose-headings:font-medium prose-headings:text-zinc-900">
                    <ReactMarkdown
                        components={{
                            h2: ({ node, ...props }) => {
                                const id = props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                return <h2 id={id} {...props} className="text-lg lg:text-xl scroll-mt-20 lg:scroll-mt-8 mb-4" />
                            }
                        }}
                    >
                        {transcript}
                    </ReactMarkdown>
                </div>
            </section>
        </div>
    )
} 