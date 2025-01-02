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
                    className="h-12 px-4 text-base font-sans bg-zinc-50/50 border-zinc-200 focus:ring-zinc-200 focus-visible:ring-zinc-200 focus:border-zinc-300"
                />
                <Button
                    onClick={onSubmit}
                    disabled={loading || !url}
                    className="h-12 px-6 font-sans font-medium bg-zinc-900 hover:bg-zinc-800 text-white custom-transition"
                >
                    {loading ? 'Processing...' : 'Process'}
                </Button>
            </div>
        </div>
    )
} 