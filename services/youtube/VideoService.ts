import { IVideoService } from '../interfaces/IVideoService';
import { VideoInfo, VideoMetadata } from '@/types/video';
import { VideoError } from '@/types/errors';

export class VideoService implements IVideoService {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new VideoError('YouTube API key is required');
        }
        this.apiKey = apiKey;
    }

    public validateVideoUrl(url: string): boolean {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(&|\?)?.*$/;
        return pattern.test(url);
    }

    public async extractVideoId(url: string): Promise<string> {
        if (!this.validateVideoUrl(url)) {
            throw new VideoError('Invalid YouTube URL format');
        }

        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);

        if (!match) {
            throw new VideoError('Could not extract video ID');
        }

        return match[1];
    }

    public async getVideoInfo(videoId: string): Promise<VideoInfo> {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.apiKey}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new VideoError(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();

            if (!data.items?.[0]) {
                throw new VideoError('Video not found');
            }

            const snippet = data.items[0].snippet;
            const thumbnailUrl = await this.getBestThumbnail(videoId);

            return {
                videoId,
                title: snippet.title,
                channelName: snippet.channelTitle,
                publishedAt: snippet.publishedAt,
                thumbnailUrl,
            };
        } catch (error) {
            if (error instanceof VideoError) {
                throw error;
            }
            throw new VideoError(`Failed to fetch video info: ${(error as Error).message}`);
        }
    }

    private async getBestThumbnail(videoId: string): Promise<string> {
        const resolutions = [
            'maxresdefault',  // 1920x1080
            'sddefault',      // 640x480
            'hqdefault',      // 480x360
            'mqdefault',      // 320x180
        ];

        for (const resolution of resolutions) {
            const url = `https://img.youtube.com/vi/${videoId}/${resolution}.jpg`;
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    return url;
                }
            } catch {
                continue;
            }
        }

        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
} 