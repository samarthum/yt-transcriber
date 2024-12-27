import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { YoutubeTranscript } from 'youtube-transcript'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const TARGET_CHUNK_SIZE = 1500;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Store the original fetch
const originalFetch = global.fetch;

// Fix the custom fetch function type definition
const customFetch: typeof fetch = (url: string | URL | Request, init?: RequestInit) => {
  return originalFetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
}

// Override global fetch for this module
global.fetch = customFetch;

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
    // Try multiple approaches to get the transcript
    const attempts = [
      // Attempt 1: Try manual captions
      () => YoutubeTranscript.fetchTranscript(videoId),
      // Attempt 2: Try auto-generated captions
      () => YoutubeTranscript.fetchTranscript(videoId, { auto: true }),
      // Attempt 3: Try English captions specifically
      () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }),
      // Attempt 4: Try auto-generated English captions
      () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en', auto: true })
    ]

    let lastError = null

    // Try each method until one works
    for (const attempt of attempts) {
      try {
        console.log(`Attempting to fetch transcript for video ${videoId}...`)
        const transcript = await attempt()
        console.log('Successfully fetched transcript')
        return transcript.map(entry => entry.text).join(' ')
      } catch (error) {
        lastError = error
        console.log('Attempt failed:', error instanceof Error ? error.message : error)
        // Continue to next attempt
        continue
      }
    }

    // If we get here, all attempts failed
    console.error('All transcript fetch attempts failed. Last error:', lastError)
    if (lastError instanceof Error) {
      console.error('Final error details:', {
        message: lastError.message,
        name: lastError.name,
        stack: lastError.stack
      })
    }
    return null

  } catch (error: unknown) {
    console.error('Unexpected error in fetchTranscript:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })

      if (
        error.message.includes('Transcript is disabled') ||
        error.message.includes('Could not find automatic captions') ||
        error.message.includes('No captions found') ||
        error.message.includes('Subtitles are disabled')
      ) {
        return null
      }
    }
    throw error
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

function chunkTranscript(transcript: string): string[] {
  const totalWords = countWords(transcript)
  console.log(`\n=== Transcript Statistics ===`)
  console.log(`Total words in transcript: ${totalWords}`)
  console.log(`Target chunk size: ${TARGET_CHUNK_SIZE} words`)

  // First split into words while preserving spacing and punctuation
  const words = transcript.split(/(\s+)/).filter(Boolean)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentWordCount = 0

  console.log(`Total word segments: ${words.length}`)

  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // Add word to current chunk
    currentChunk.push(word)
    if (!word.match(/^\s+$/)) { // Only count non-whitespace as words
      currentWordCount++
    }

    // Check if we should create a new chunk
    if (currentWordCount >= TARGET_CHUNK_SIZE) {
      // Look ahead for a good breaking point (period, question mark, or exclamation)
      let lookAhead = 0
      while (i + lookAhead < words.length && lookAhead < 50) {
        if (words[i + lookAhead].match(/[.!?]\s*$/)) {
          i += lookAhead // Skip to this point
          break
        }
        lookAhead++
      }

      // Add any remaining words up to the break point
      while (lookAhead > 0) {
        currentChunk.push(words[++i])
        lookAhead--
      }

      // Create chunk and reset
      const chunkText = currentChunk.join('')
      chunks.push(chunkText)
      console.log(`\nChunk ${chunks.length} created:`)
      console.log(`- Word count: ${countWords(chunkText)}`)
      console.log(`- First 100 chars: ${chunkText.slice(0, 100)}...`)

      currentChunk = []
      currentWordCount = 0
    }
  }

  // Add final chunk if there's content left
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join('')
    chunks.push(chunkText)
    console.log(`\nFinal chunk ${chunks.length} created:`)
    console.log(`- Word count: ${countWords(chunkText)}`)
    console.log(`- First 100 chars: ${chunkText.slice(0, 100)}...`)
  }

  console.log(`\n=== Chunking Complete ===`)
  console.log(`Created ${chunks.length} chunks`)
  console.log(`Average chunk size: ${Math.round(totalWords / chunks.length)} words`)

  return chunks
}

async function formatChunk(chunk: string, index: number, totalChunks: number, anthropic: Anthropic): Promise<string> {
  console.log(`\n=== Formatting Chunk ${index + 1}/${totalChunks} ===`)
  console.log(`Input chunk size: ${countWords(chunk)} words`)

  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Estimate tokens (rough approximation: 1 word ≈ 1.3 tokens)
      const estimatedTokens = Math.ceil(countWords(chunk) * 1.3)
      const MAX_OUTPUT_TOKENS = 8192

      if (estimatedTokens > MAX_OUTPUT_TOKENS) {
        console.error(`WARNING: Chunk ${index + 1} might exceed token limit!`)
        console.error(`Estimated tokens: ${estimatedTokens} (max: ${MAX_OUTPUT_TOKENS})`)
      }

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: Math.min(8192, estimatedTokens + 1000),
        temperature: 0.4,
        messages: [{
          role: "user",
          content: `Rewrite this transcript text to be more readable and concise, removing filler words and fixing grammar, but preserving the core meaning.
Present the final output as well-structured Markdown with proper heading hierarchy and formatting:

${chunk}

ABSOLUTE REQUIREMENTS:
1. Do NOT add any commentary or label like [Continued].
2. Do NOT skip or summarize entire sections. You may remove meaningless filler words if they add no value.
3. Format the document with proper heading hierarchy:
   - Use ## for all section headings (no single # headings)
   - Use ### for subsections if needed
4. You may unify or replace repeated words (e.g. "um", "uh", etc.).
5. Use punctuation, paragraph breaks, bullet points, and emphasis (*italics* or **bold**) where appropriate.
6. Maintain the overall flow and important content from the original text.
7. Do NOT create empty sections - if a section has no content, omit it entirely.

FORMATTING GUIDELINES:
- Start each section heading with ## (not #)
- Add a blank line before and after each heading
- Use **bold** for emphasis on key terms or important statements
- Use *italics* for secondary emphasis or quoted terms
- Use bullet points for lists or related items
- Ensure each section has actual content (no empty sections)

Please provide the final rewritten text without any extraneous markers or disclaimers.`
        }]
      })

      const formattedText = message.content[0].text
      return formattedText

    } catch (error) {
      console.error(`Attempt ${attempt} failed for chunk ${index + 1}:`, error)

      if (attempt === MAX_RETRIES) {
        // If this was our last attempt, try returning a basic formatted version
        console.error(`All retry attempts failed for chunk ${index + 1}. Falling back to basic formatting.`)
        return `## Content

${chunk.trim()}`
      }

      // If it's not the last attempt, wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      continue
    }
  }

  // This should never be reached due to the fallback in the catch block
  return chunk
}

async function processTranscript(rawTranscript: string) {
  try {
    console.log(`\n====== Starting Transcript Processing ======`)
    console.log(`Input transcript length: ${rawTranscript.length} characters`)
    console.log(`Input transcript words: ${countWords(rawTranscript)}`)

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Step 1: Get executive summary
    console.log(`\n=== Generating Summary ===`)
    const summaryMessage = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: `Provide a concise executive summary of this transcript in 3-5 key bullet points:

${rawTranscript}

Format as markdown bullet points. Only include the summary points.`
      }]
    })

    const summary = summaryMessage.content[0].text

    // Step 2: Split transcript into chunks
    console.log(`\n=== Chunking Transcript ===`)
    const chunks = chunkTranscript(rawTranscript)

    // Step 3: Process chunks sequentially with better error handling
    console.log(`\n=== Processing Chunks ===`)
    const formattedChunks: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`\nProcessing chunk ${i + 1}/${chunks.length}`)
        const formattedChunk = await formatChunk(chunks[i], i, chunks.length, anthropic)
        formattedChunks.push(formattedChunk)
      } catch (error) {
        console.error(`Failed to process chunk ${i + 1}:`, error)
        // Add the original chunk with minimal formatting if processing fails
        formattedChunks.push(`## Content\n\n${chunks[i].trim()}`)
      }
    }

    // Step 4: Combine chunks
    console.log(`\n=== Combining Chunks ===`)
    const structuredTranscript = formattedChunks
      .map((chunk, index) => {
        // Clean up any visible hash symbols at the start of the text
        chunk = chunk.replace(/^#\s+/, '')

        // Remove empty sections (heading followed by no content)
        chunk = chunk.replace(/#{1,3}\s+([^\n]+)\n\s*(?=#{1,3}|$)/g, '')

        if (index === 0) return chunk

        const prevChunk = formattedChunks[index - 1]

        // Look for overlap based on multiple patterns
        const patterns = [
          /^\s*\*\*[^:]+:\*\*/, // Speaker patterns
          /^\s*\[\d{1,2}:\d{2}\]/, // Timestamp patterns
          /^\s*#{1,3}\s+/, // Section headers (1-3 hash symbols)
        ]

        for (const pattern of patterns) {
          const match = chunk.match(pattern)
          if (match) {
            // Find the last occurrence of this pattern in previous chunk
            const lastIndex = prevChunk.lastIndexOf(match[0])
            if (lastIndex !== -1) {
              // Remove overlapping content
              return chunk.slice(match[0].length).trim()
            }
          }
        }

        return chunk
      })
      .filter(chunk => chunk.length > 0 && !/^\s*$/.test(chunk)) // Remove empty chunks
      .join('\n\n')

    console.log(`\n=== Processing Complete ===`)
    console.log(`Final output length: ${structuredTranscript.length} characters`)
    console.log(`Final output words: ${countWords(structuredTranscript)}`)
    console.log(`=====================================\n`)

    return { summary, structuredTranscript }
  } catch (error) {
    console.error('Error processing transcript:', error)
    // Provide more specific error message to the client
    const errorMessage = error instanceof Error
      ? `Failed to process transcript: ${error.message}`
      : 'An unknown error occurred while processing the transcript'
    throw new Error(errorMessage)
  }
}

// Helper function to find longest common substring
function findLongestCommonSubstring(str1: string, str2: string): string {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))
  let maxLength = 0
  let endIndex = 0

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j]
          endIndex = i - 1
        }
      }
    }
  }

  return str1.slice(endIndex - maxLength + 1, endIndex + 1)
}

