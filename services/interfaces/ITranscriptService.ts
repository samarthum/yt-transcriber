import { TranscriptSegment, TranscriptOptions } from '@/types/transcript';

export interface ITranscriptService {
    fetchTranscript(videoId: string, options?: TranscriptOptions): Promise<TranscriptSegment[]>;
    getRawTranscript(videoId: string): Promise<string>;
} 