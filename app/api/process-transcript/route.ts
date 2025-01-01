import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { ServiceFactory } from '@/services/ServiceFactory';
import { VideoError, TranscriptError, AIServiceError } from '@/types/errors';
import { chunkText, estimateTokens } from '@/lib/textUtils';

const MAX_INPUT_TOKENS = 200000;   // Claude's input context window
const MAX_OUTPUT_TOKENS = 8192;    // Claude's output token limit
const PROMPT_TOKEN_ESTIMATE = 300; // Approximate tokens in our prompt

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Initialize services
        const config = getConfig();
        const factory = ServiceFactory.initialize(config);
        const videoService = factory.getVideoService();
        const transcriptService = factory.getTranscriptService();
        const aiService = factory.getAIService();

        // Send initial progress
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 0, step: 'Starting process...' })}\n\n`
          )
        );

        // Parse request
        const { videoUrl } = await req.json();
        if (!videoUrl) {
          throw new Error('YouTube URL is required');
        }

        // Process video URL
        const videoId = await videoService.extractVideoId(videoUrl);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        // Update progress
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 20, step: 'Fetching video info and transcript...' })}\n\n`
          )
        );

        // Fetch video info and transcript in parallel
        const [videoInfo, rawTranscript] = await Promise.all([
          videoService.getVideoInfo(videoId),
          transcriptService.getRawTranscript(videoId)
        ]);

        if (!rawTranscript) {
          throw new Error('No captions available for this video');
        }

        // Update progress
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 40, step: 'Processing transcript format...' })}\n\n`
          )
        );

        // Format transcript
        const structuredTranscript = await aiService.formatTranscript(rawTranscript);

        // Update progress
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 70, step: 'Generating summary...' })}\n\n`
          )
        );

        // Generate summary
        const summary = await aiService.generateSummary(rawTranscript);

        // Send final result
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              progress: 100,
              step: 'Complete',
              done: true,
              videoInfo,
              structuredTranscript,
              summary
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Processing error:', error);

        // Send error to client
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : 'An unknown error occurred',
              progress: 0,
              step: 'Error'
            })}\n\n`
          )
        );

        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
