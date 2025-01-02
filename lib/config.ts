import { VideoError, AIServiceError } from '@/types/errors';

export interface Config {
    youtube: {
        apiKey: string;
    };
    anthropic: {
        apiKey: string;
        defaultModel: string;
    };
}

export function getConfig(): Config {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!youtubeApiKey) {
        throw new VideoError('YOUTUBE_API_KEY is not configured');
    }

    if (!anthropicApiKey) {
        throw new AIServiceError('ANTHROPIC_API_KEY is not configured');
    }

    return {
        youtube: {
            apiKey: youtubeApiKey,
        },
        anthropic: {
            apiKey: anthropicApiKey,
            defaultModel: "claude-3-5-haiku-20241022",
        },
    };
} 