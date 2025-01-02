import { IAIService, AIRequestOptions } from '../interfaces/IAIService';
import { AIServiceError } from '@/types/errors';
import Anthropic from '@anthropic-ai/sdk';
import {
    TRANSCRIPT_FORMAT_PROMPT,
    SUMMARY_PROMPT
} from './prompts/transcriptPrompts';
import { chunkText } from '@/lib/textUtils';

export class AIService implements IAIService {
    private readonly client: Anthropic;
    private readonly defaultModel: string;
    private readonly MAX_CHUNK_SIZE = 12000; // ~12000 characters (~3000 words)
    private readonly MAX_OUTPUT_TOKENS = 8192; // Maximum allowed output tokens for Claude 3.5 Sonnet

    constructor(apiKey: string, defaultModel: string) {
        if (!apiKey) {
            throw new AIServiceError('Anthropic API key is required');
        }
        this.client = new Anthropic({ apiKey });
        this.defaultModel = defaultModel;
    }

    public async processWithRateLimit<T>(
        tasks: (() => Promise<T>)[],
        maxConcurrent: number = 2
    ): Promise<T[]> {
        const results: T[] = [];
        const running: Promise<void>[] = [];

        for (const task of tasks) {
            if (running.length >= maxConcurrent) {
                await Promise.race(running);
            }

            const promise = task().then(result => {
                results.push(result);
                running.splice(running.indexOf(promise), 1);
            });

            running.push(promise);
        }

        await Promise.all(running);
        return results;
    }

    private async processChunkWithRetry(
        prompt: string,
        maxRetries: number = 3,
        retryDelay: number = 1000
    ): Promise<string> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.messages.create({
                    model: this.defaultModel,
                    max_tokens: this.MAX_OUTPUT_TOKENS,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                });

                let result = '';
                for await (const event of response) {
                    if (event.type === 'content_block_delta') {
                        result += event.delta.text;
                    }
                }
                return result.trim();
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
        throw new AIServiceError('Failed after max retries');
    }

    public async formatTranscript(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            const chunks = chunkText(text, this.MAX_CHUNK_SIZE, 500);
            let formattedChunks: string[] = [];
            let totalProgress = 0;

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                // Get context from previous and next chunks
                const previousContext = i > 0 ? chunks[i - 1].slice(-300) : '';
                const nextContext = i < chunks.length - 1 ? chunks[i + 1].slice(0, 300) : '';

                // Create context-aware prompt
                const prompt = TRANSCRIPT_FORMAT_PROMPT
                    .replace('{text}', chunk)
                    .replace('{partNumber}', (i + 1).toString())
                    .replace('{totalParts}', chunks.length.toString())
                    .replace('{previousContext}', previousContext || '(Start of transcript)')
                    .replace('{nextContext}', nextContext || '(End of transcript)');

                try {
                    const chunkResult = await this.processChunkWithRetry(prompt);
                    formattedChunks.push(chunkResult);

                    totalProgress = ((i + 1) / chunks.length) * 100;
                    if (onProgress) {
                        onProgress(Math.min(totalProgress, 100));
                    }
                } catch (error) {
                    console.error(`Failed to process chunk ${i + 1}/${chunks.length}:`, error);
                    throw error;
                }
            }

            // Join chunks with a newline separator
            return formattedChunks.join('\n\n');
        } catch (error) {
            throw new AIServiceError(
                `Failed to format transcript: ${(error as Error).message}`
            );
        }
    }

    public async generateSummary(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            const prompt = SUMMARY_PROMPT.replace('{text}', text);

            try {
                const result = await this.processChunkWithRetry(prompt);
                if (onProgress) onProgress(100);
                return result;
            } catch (error) {
                console.error('Failed to generate summary:', error);
                throw error;
            }
        } catch (error) {
            throw new AIServiceError(
                `Failed to generate summary: ${(error as Error).message}`
            );
        }
    }
} 