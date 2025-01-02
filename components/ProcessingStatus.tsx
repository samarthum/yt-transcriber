'use client'

interface ProcessingStatusProps {
    progress: number
    currentStep: string
}

export function ProcessingStatus({ progress, currentStep }: ProcessingStatusProps) {
    return (
        <div className="max-w-xl mx-auto text-center">
            <div className="space-y-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-sm text-muted-foreground">{currentStep}</p>
            </div>
        </div>
    )
} 