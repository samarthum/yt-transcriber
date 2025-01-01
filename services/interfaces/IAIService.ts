export interface AIRequestOptions {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    onProgress?: (progress: number) => void;
}

export interface IAIService {
    formatTranscript(text: string, onProgress?: (progress: number) => void): Promise<string>;
    generateSummary(text: string, onProgress?: (progress: number) => void): Promise<string>;
    processWithRateLimit(tasks: Array<() => Promise<string>>): Promise<string[]>;
} 