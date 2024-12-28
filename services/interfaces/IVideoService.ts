import { VideoInfo, VideoMetadata } from '@/types/video';

export interface IVideoService {
    extractVideoId(url: string): Promise<string>;
    getVideoInfo(videoId: string): Promise<VideoInfo>;
    validateVideoUrl(url: string): boolean;
} 