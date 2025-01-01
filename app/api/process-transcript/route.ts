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
  const readableStream = new ReadableStream({
    async start(controller) {
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
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'YouTube URL is required' })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Process video URL
        const videoId = await videoService.extractVideoId(videoUrl);
        if (!videoId) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Invalid YouTube URL' })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Fetch video info and transcript in parallel
        const [videoInfo, rawTranscript] = await Promise.all([
          videoService.getVideoInfo(videoId),
          transcriptService.getRawTranscript(videoId)
        ]);

        if (!rawTranscript) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  'No captions available for this video. The video might not have captions, or they might be disabled.'
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Send progress update: Transcript fetched
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 0, step: 'Transcript fetched' })}\n\n`
          )
        );

        // Process transcript
        const chunks = chunkText(rawTranscript, {
          targetSize: 1000,
          maxTokens: MAX_INPUT_TOKENS - PROMPT_TOKEN_ESTIMATE
        });

        // Process transcript with rate limiting
        const processChunks = async () => {
          const totalChunks = chunks.length;
          const formattedChunks: string[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const chunk = chunks[i];
            const inputTokens = estimateTokens(chunk);
            const formattedChunk = await aiService.formatTranscript(chunk, {
              temperature: 0.5,
              maxTokens: MAX_OUTPUT_TOKENS
            });
            formattedChunks.push(formattedChunk);

            // Calculate and send progress update
            const progress = Math.round(((i + 1) / totalChunks) * 50); // 50% for formatting
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  progress,
                  step: 'Formatting transcript'
                })}\n\n`
              )
            );
          }

          return formattedChunks.join('\n\n');
        };

        // Generate summary and format transcript sequentially instead of in parallel
        const structuredTranscript = await processChunks();

        // Send progress update: Transcript formatted
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 50, step: 'Transcript formatted' })}\n\n`
          )
        );

        const summary = await aiService.generateSummary(rawTranscript, {
          temperature: 0.3,
          maxTokens: 1500
        });

        // Send progress update: Summary generated
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 100, step: 'Summary generated' })}\n\n`
          )
        );

        // Send final result
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              videoInfo,
              structuredTranscript,
              summary,
              done: true
            })}\n\n`
          )
        );
      } catch (error) {
        console.error('Error processing transcript:', error);

        // Handle specific error types
        if (error instanceof VideoError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
        } else if (error instanceof TranscriptError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
        } else if (error instanceof AIServiceError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
        } else {
          // Generic error handling
          const errorMessage =
            error instanceof Error ? error.message : 'An unknown error occurred';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
        }
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
