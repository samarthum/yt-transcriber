import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'

interface TranscriptContentProps {
    summary: string
    transcript: string
}

export function TranscriptContent({ summary, transcript }: TranscriptContentProps) {
    return (
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            <section id="key-takeaways">
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg lg:text-xl font-medium text-foreground">
                            Key Takeaways
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-zinc prose-sm dark:prose-invert [&>*:first-child]:mt-0">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="transcript-content">
                <div className="prose prose-zinc max-w-none px-0 sm:px-4">
                    <ReactMarkdown
                        components={{
                            h2: ({ node, ...props }) => {
                                const id = props.children
                                    ?.toString()
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                return (
                                    <h2
                                        id={id}
                                        {...props}
                                        className="
                                            text-xl lg:text-2xl 
                                            font-bold 
                                            text-foreground 
                                            mt-12 mb-6 
                                            scroll-mt-24 
                                            border-b border-border 
                                            pb-4
                                            !important
                                        "
                                        style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                        }}
                                    />
                                )
                            },
                            h3: ({ node, ...props }) => {
                                const id = props.children
                                    ?.toString()
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                return (
                                    <h3
                                        id={id}
                                        {...props}
                                        className="
                                            text-lg lg:text-xl 
                                            font-medium 
                                            text-muted-foreground 
                                            mt-8 mb-4 
                                            scroll-mt-24
                                            !important
                                        "
                                        style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 500,
                                        }}
                                    />
                                )
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