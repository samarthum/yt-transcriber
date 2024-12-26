import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCaptions } from '@dofy/youtube-caption-fox'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json()

    if (!videoUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoInfo = await fetchVideoInfo(videoId)
    const rawTranscript = await fetchTranscript(videoId)

    if (!rawTranscript) {
      return NextResponse.json({ error: 'No captions available for this video. The video might not have captions, or they might be disabled.' }, { status: 404 })
    }

    const { structuredTranscript, summary } = await processTranscript(rawTranscript)

    return NextResponse.json({
      videoInfo,
      structuredTranscript,
      summary,
    })
  } catch (error: unknown) {
    console.error('Error processing transcript:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function fetchVideoInfo(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not set in the environment variables')
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`)
  }

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

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const { captions } = await getCaptions(videoId)

    if (!captions || captions.length === 0) {
      console.error('No captions found for video ID:', videoId)
      return null
    }

    const transcriptText = captions.map(caption => caption.text).join(' ')
    return transcriptText
  } catch (error: unknown) {
    console.error('Error fetching transcript:', error)
    if (error instanceof Error && error.message.includes('Captions not found')) {
      return null
    }
    throw error
  }
}

async function processTranscript(rawTranscript: string) {
  try {
    let isComplete = false
    let attempt = 1
    const MAX_ATTEMPTS = 4

    const messages = [
      {
        role: "user" as const,
        content: `You are an expert content editor specializing in transforming raw YouTube video transcripts into well-structured, readable content while preserving all original information. Your task is to format the transcript and create a concise executive summary.

Here is the raw transcript you need to work with:

<raw_transcript>
${rawTranscript}
</raw_transcript>

Please format your response in clean markdown, following these requirements:

1. Create an executive summary:
   - Provide 3-5 key bullet points capturing the main ideas
   - Keep each bullet point to 1-2 sentences
   - Focus on the core message and key takeaways

2. Format the transcript:
   - Use markdown headings (## for main sections, ### for subsections)
   - Break text into logical paragraphs with proper line spacing
   - Use **bold** for key concepts/terms
   - Use proper markdown lists (- or 1. for lists)
   - Use _italics_ for emphasis where appropriate
   - Maintain any timestamps if present
   - Preserve ALL original content - do not summarize or remove anything

Your response must follow this exact structure:

## Executive Summary

- Key point 1
- Key point 2
- Key point 3

## Formatted Transcript

[Your formatted content here with proper markdown...]

If you cannot complete the formatting in one response, end with <continued>. If you are finished, end with <complete>.`
      }
    ]

    let fullResponse = ''

    while (!isComplete && attempt <= MAX_ATTEMPTS) {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        messages: messages as Array<{ role: "user" | "assistant", content: string }>
      })

      const response = message.content[0].text

      if (!response) {
        throw new Error('Failed to generate structured transcript and summary')
      }

      // Remove continuation markers if present
      const cleanResponse = response.replace(/<continued>|<complete>/g, '').trim()

      // Append to full response
      fullResponse += (fullResponse ? '\n' : '') + cleanResponse

      messages.push({
        role: "assistant" as const,
        content: cleanResponse
      })

      if (!response.includes('<complete>') && attempt < MAX_ATTEMPTS) {
        messages.push({
          role: "user" as const,
          content: "Please continue formatting the transcript from where you left off, maintaining the same markdown formatting. End with <continued> if not finished, or <complete> if done."
        })
      }

      isComplete = response.includes('<complete>') || attempt === MAX_ATTEMPTS
      attempt++
    }

    // Parse the complete response - looking specifically for markdown sections
    const summaryMatch = fullResponse.match(/## Executive Summary\s*([\s\S]*?)(?=## Formatted Transcript|$)/i)
    const transcriptMatch = fullResponse.match(/## Formatted Transcript\s*([\s\S]*?)$/i)

    if (!summaryMatch || !transcriptMatch) {
      throw new Error('Invalid response format from AI')
    }

    return {
      summary: summaryMatch[1].trim(),
      structuredTranscript: transcriptMatch[1].trim(),
    }
  } catch (error) {
    const err = error as Error
    console.error('Error processing transcript with Anthropic:', err)
    throw new Error(`Failed to process transcript with Anthropic: ${err.message}`)
  }
}

