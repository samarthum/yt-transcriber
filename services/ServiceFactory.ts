import { Config } from '@/lib/config';
import { VideoService } from './youtube/VideoService';
import { TranscriptService } from './youtube/TranscriptService';
import { AIService } from './ai/AIService';
import { IVideoService } from './interfaces/IVideoService';
import { ITranscriptService } from './interfaces/ITranscriptService';
import { IAIService } from './interfaces/IAIService';

export class ServiceFactory {
    private static instance: ServiceFactory;
    private videoService?: IVideoService;
    private transcriptService?: ITranscriptService;
    private aiService?: IAIService;

    private constructor(private config: Config) { }

    public static initialize(config: Config): ServiceFactory {
        if (!ServiceFactory.instance) {
            ServiceFactory.instance = new ServiceFactory(config);
        }
        return ServiceFactory.instance;
    }

    public static getInstance(): ServiceFactory {
        if (!ServiceFactory.instance) {
            throw new Error('ServiceFactory must be initialized with config first');
        }
        return ServiceFactory.instance;
    }

    public getVideoService(): IVideoService {
        if (!this.videoService) {
            this.videoService = new VideoService(this.config.youtube.apiKey);
        }
        return this.videoService;
    }

    public getTranscriptService(): ITranscriptService {
        if (!this.transcriptService) {
            this.transcriptService = new TranscriptService();
        }
        return this.transcriptService;
    }

    public getAIService(): IAIService {
        if (!this.aiService) {
            this.aiService = new AIService(
                this.config.anthropic.apiKey,
                this.config.anthropic.defaultModel
            );
        }
        return this.aiService;
    }
} 