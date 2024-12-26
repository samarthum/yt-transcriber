declare module 'youtube-transcript' {
    export interface TranscriptResponse {
        text: string;
        duration: number;
        offset: number;
    }

    export interface TranscriptConfig {
        lang?: string;
        auto?: boolean;
    }

    export class YoutubeTranscript {
        static fetchTranscript(videoId: string, config?: TranscriptConfig): Promise<TranscriptResponse[]>;
    }
} 