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

    public async formatTranscript(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            // Split text into manageable chunks
            const chunks = chunkText(text);
            let formattedChunks: string[] = [];
            let totalProgress = 0;

            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const prompt = TRANSCRIPT_FORMAT_PROMPT.replace('{text}', chunk);

                const response = await this.client.messages.create({
                    model: this.defaultModel,
                    max_tokens: 4000,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                });

                let chunkResult = '';
                for await (const event of response) {
                    if (event.type === 'content_block_delta') {
                        chunkResult += event.delta.text;
                        if (onProgress) {
                            // Calculate progress considering all chunks
                            const chunkProgress = (chunkResult.length / chunk.length) * (100 / chunks.length);
                            const overallProgress = totalProgress + chunkProgress;
                            onProgress(Math.min(overallProgress, 100));
                        }
                    }
                }
                formattedChunks.push(chunkResult.trim());
                totalProgress += 100 / chunks.length;
            }

            // Combine chunks with proper formatting
            return formattedChunks.join('\n\n');
        } catch (error) {
            if (error instanceof Error && error.message.includes('rate_limit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.formatTranscript(text, onProgress);
            }
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
            // For summary, we'll first chunk and summarize each part
            const chunks = chunkText(text);
            let summaries: string[] = [];
            let totalProgress = 0;

            // First pass: summarize each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const prompt = SUMMARY_PROMPT.replace('{text}', chunk);

                const response = await this.client.messages.create({
                    model: this.defaultModel,
                    max_tokens: 4000,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                });

                let chunkResult = '';
                for await (const event of response) {
                    if (event.type === 'content_block_delta') {
                        chunkResult += event.delta.text;
                        if (onProgress) {
                            const chunkProgress = (chunkResult.length / chunk.length) * (50 / chunks.length);
                            const overallProgress = totalProgress + chunkProgress;
                            onProgress(Math.min(overallProgress, 50)); // First 50% for individual summaries
                        }
                    }
                }
                summaries.push(chunkResult.trim());
                totalProgress += 50 / chunks.length;
            }

            // Second pass: combine summaries if needed
            if (summaries.length > 1) {
                const combinedSummary = summaries.join('\n\n');
                const finalPrompt = SUMMARY_PROMPT.replace('{text}', combinedSummary);

                const response = await this.client.messages.create({
                    model: this.defaultModel,
                    max_tokens: 4000,
                    messages: [{ role: 'user', content: finalPrompt }],
                    stream: true
                });

                let finalResult = '';
                for await (const event of response) {
                    if (event.type === 'content_block_delta') {
                        finalResult += event.delta.text;
                        if (onProgress) {
                            const progress = 50 + (finalResult.length / combinedSummary.length) * 50;
                            onProgress(Math.min(progress, 100)); // Last 50% for final summary
                        }
                    }
                }
                return finalResult.trim();
            }

            return summaries[0];
        } catch (error) {
            if (error instanceof Error && error.message.includes('rate_limit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.generateSummary(text, onProgress);
            }
            throw new AIServiceError(
                `Failed to generate summary: ${(error as Error).message}`
            );
        }
    }
} 