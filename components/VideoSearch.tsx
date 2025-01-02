import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface VideoSearchProps {
    url: string
    loading: boolean
    onUrlChange: (url: string) => void
    onSubmit: () => void
}

export function VideoSearch({ url, loading, onUrlChange, onSubmit }: VideoSearchProps) {
    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    type="text"
                    placeholder="Paste YouTube URL here..."
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    className="h-11 px-4 text-base font-sans bg-muted border-input focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                    onClick={onSubmit}
                    disabled={loading || !url}
                    className="h-11 px-5 font-sans text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {loading ? 'Processing...' : 'Process'}
                </Button>
            </div>
        </div>
    )
} 