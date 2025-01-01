import { getConfig } from '@/lib/config';
import { ServiceFactory } from '@/services/ServiceFactory';

// Mark this route as using Edge Runtime
export const runtime = 'edge';

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

        // Parse request and get video info
        const { videoUrl } = await req.json();
        const videoId = await videoService.extractVideoId(videoUrl);

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

        // Update progress for transcript formatting
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 40, step: 'Processing transcript format...' })}\n\n`
          )
        );

        // Format transcript with streaming updates
        const structuredTranscript = await aiService.formatTranscript(
          rawTranscript,
          (progress) => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ progress: 40 + progress * 0.3, step: 'Formatting transcript...' })}\n\n`
              )
            );
          }
        );

        // Update progress for summary generation
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ progress: 70, step: 'Generating summary...' })}\n\n`
          )
        );

        // Generate summary with streaming updates
        const summary = await aiService.generateSummary(
          rawTranscript,
          (progress) => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ progress: 70 + progress * 0.3, step: 'Generating summary...' })}\n\n`
              )
            );
          }
        );

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
