import { IAIService, AIRequestOptions } from '../interfaces/IAIService';
import { AIServiceError } from '@/types/errors';
import Anthropic from '@anthropic-ai/sdk';
import {
    TRANSCRIPT_FORMAT_PROMPT,
    SUMMARY_PROMPT
} from './prompts/transcriptPrompts';

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

    private async processWithRateLimit<T>(
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
        options?: AIRequestOptions
    ): Promise<string> {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const prompt = TRANSCRIPT_FORMAT_PROMPT.replace('{text}', text);
            const response = await this.createCompletion(prompt, options);
            return response.trim();
        } catch (error) {
            if (error instanceof Error && error.message.includes('rate_limit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.formatTranscript(text, options);
            }
            throw new AIServiceError(
                `Failed to format transcript: ${(error as Error).message}`
            );
        }
    }

    public async generateSummary(
        text: string,
        options?: AIRequestOptions
    ): Promise<string> {
        try {
            const prompt = SUMMARY_PROMPT.replace('{text}', text);
            const response = await this.createCompletion(prompt, options);
            return response.trim();
        } catch (error) {
            throw new AIServiceError(
                `Failed to generate summary: ${(error as Error).message}`
            );
        }
    }

    private async createCompletion(
        prompt: string,
        options?: AIRequestOptions
    ): Promise<string> {
        const response = await this.client.messages.create({
            model: options?.model || this.defaultModel,
            max_tokens: options?.maxTokens || 4000,
            temperature: options?.temperature || 0.5,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        return response.content[0].text;
    }
} 