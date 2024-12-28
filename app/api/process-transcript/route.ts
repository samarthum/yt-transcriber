import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { ServiceFactory } from '@/services/ServiceFactory';
import { VideoError, TranscriptError, AIServiceError } from '@/types/errors';
import { chunkText, estimateTokens } from '@/lib/textUtils';

const MAX_INPUT_TOKENS = 200000;   // Claude's input context window
const MAX_OUTPUT_TOKENS = 8192;    // Claude's output token limit
const PROMPT_TOKEN_ESTIMATE = 300; // Approximate tokens in our prompt

export async function POST(req: Request) {
  try {
    // Initialize services
    const config = getConfig();
    const factory = ServiceFactory.initialize(config);
    const videoService = factory.getVideoService();
    const transcriptService = factory.getTranscriptService();
    const aiService = factory.getAIService();

    // Parse request
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Process video URL
    const videoId = await videoService.extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video info and transcript in parallel
    const [videoInfo, rawTranscript] = await Promise.all([
      videoService.getVideoInfo(videoId),
      transcriptService.getRawTranscript(videoId)
    ]);

    if (!rawTranscript) {
      return NextResponse.json(
        {
          error: 'No captions available for this video. The video might not have captions, or they might be disabled.'
        },
        { status: 404 }
      );
    }

    // Process transcript
    const chunks = chunkText(rawTranscript, {
      targetSize: 1000,
      maxTokens: MAX_INPUT_TOKENS - PROMPT_TOKEN_ESTIMATE
    });

    // Process transcript with rate limiting
    const processChunks = async () => {
      const tasks = chunks.map(chunk => async () => {
        const inputTokens = estimateTokens(chunk);
        return aiService.formatTranscript(chunk, {
          temperature: 0.5,
          maxTokens: MAX_OUTPUT_TOKENS
        });
      });

      const formattedChunks = await aiService.processWithRateLimit(tasks);
      return formattedChunks.join('\n\n');
    };

    // Generate summary and format transcript sequentially instead of in parallel
    const structuredTranscript = await processChunks();
    const summary = await aiService.generateSummary(rawTranscript, {
      temperature: 0.3,
      maxTokens: 1500
    });

    return NextResponse.json({
      videoInfo,
      structuredTranscript,
      summary,
    });

  } catch (error) {
    console.error('Error processing transcript:', error);

    // Handle specific error types
    if (error instanceof VideoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof TranscriptError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AIServiceError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
