export interface AIRequestOptions {
    maxTokens?: number;
    temperature?: number;
    model?: string;
}

export interface IAIService {
    formatTranscript(text: string, options?: AIRequestOptions): Promise<string>;
    generateSummary(text: string, options?: AIRequestOptions): Promise<string>;
} 