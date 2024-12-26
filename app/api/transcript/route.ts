import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import Anthropic from '@anthropic-ai/sdk'

// Define error types
type TranscriptError = {
  message: string;
}

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json()
    const videoId = extractVideoId(videoUrl)

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoInfo = await fetchVideoInfo(videoId)
    let rawTranscript: string

    try {
      rawTranscript = await fetchTranscript(videoId)
    } catch (error) {
      const transcriptError = error as TranscriptError
      if (transcriptError.message.includes('Transcript is disabled on this video')) {
        return NextResponse.json({ error: 'Transcript is not available for this video. The creator may have disabled it.' }, { status: 404 })
      }
      throw error
    }

    const { structuredTranscript, summary } = await processTranscript(rawTranscript)

    return NextResponse.json({
      videoInfo,
      structuredTranscript,
      summary,
    })
  } catch (error) {
    const err = error as Error
    console.error('Error processing transcript:', err)
    return NextResponse.json({ error: err.message || 'An unknown error occurred' }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function fetchVideoInfo(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not set in the environment variables')
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`)
  const data = await response.json()

  if (data.items && data.items.length > 0) {
    const snippet = data.items[0].snippet
    // Try to get the highest quality thumbnail available
    const thumbnailUrl =
      snippet.thumbnails.maxres?.url ||
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.standard?.url ||
      snippet.thumbnails.medium.url

    return {
      title: snippet.title,
      channelName: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      thumbnailUrl,
    }
  }

  throw new Error('Video info not found')
}

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    const transcriptText = transcript.map(entry => entry.text).join(' ')
    console.log('Raw transcript from YoutubeTranscript:', transcriptText.substring(0, 500) + '...')
    return transcriptText
  } catch (error) {
    console.error('Error fetching transcript:', error)
    throw error
  }
}

async function processTranscript(rawTranscript: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment variables')
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  })

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: "You are a helpful assistant that structures and summarizes YouTube video transcripts.",
      messages: [
        {
          role: "user",
          content: `You are given a raw transcript from a YouTube video. Please:
            1. Segment it into readable sections (include timestamps or approximate headings).
            2. Organize it with headings, bullet points, or paragraphs for clarity.
            3. Provide a short summary (2-3 sentences) of main ideas at the end.

            Raw transcript:
            ${rawTranscript}

            Please format your response as follows:
            STRUCTURED_TRANSCRIPT:
            [Your formatted transcript here]

            SUMMARY:
            [Your 2-3 sentence summary here]`
        }
      ],
      temperature: 0.7,
    })

    const response = message.content[0].text

    if (!response) {
      throw new Error('Failed to generate structured transcript and summary')
    }

    const [structuredTranscript, summary] = response.split('SUMMARY:')

    return {
      structuredTranscript: structuredTranscript.replace('STRUCTURED_TRANSCRIPT:', '').trim(),
      summary: summary.trim(),
    }
  } catch (error) {
    const err = error as Error
    console.error('Error processing transcript with Anthropic:', err)
    throw new Error(`Failed to process transcript with Anthropic: ${err.message}`)
  }
}

