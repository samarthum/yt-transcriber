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
        <div className="flex gap-4 mb-8">
            <Input
                type="text"
                placeholder="Enter YouTube URL"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                className="flex-grow"
            />
            <Button
                onClick={onSubmit}
                disabled={loading || !url}
                className="font-sans bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all"
            >
                {loading ? 'Processing...' : 'Process'}
            </Button>
        </div>
    )
} 