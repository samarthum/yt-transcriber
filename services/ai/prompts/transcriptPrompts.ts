export const TRANSCRIPT_FORMAT_PROMPT = `Format this section (PART {partNumber} of {totalParts}) of a transcript as well-structured Markdown in English.

PREVIOUS CONTEXT:
{previousContext}

CURRENT SECTION TO FORMAT:
{text}

NEXT CONTEXT:
{nextContext}

REQUIREMENTS:
1. Format ONLY the CURRENT SECTION into clear, readable paragraphs
2. Use ## for major topic changes or significant shifts in conversation
3. Focus on flowing narrative paragraphs rather than bullet points
4. Use bullet points sparingly and only when listing:
   - Multiple distinct speakers
   - Explicit step-by-step instructions
5. Break long discussions into digestible paragraphs with clear topic sentences. A single topic can have multiple paragraphs.
6. Preserve speaker names if present (in **bold**)
7. Maintain chronological flow and conversational context
8. Always output in English, even if the input is in another language
9. If translating, maintain accuracy and natural flow
10. Do not add concluding paragraphs unless this is the final part ({partNumber} equals {totalParts})

Format ONLY the CURRENT SECTION as clean, narrative-focused Markdown.`;

export const SUMMARY_PROMPT = `Provide a concise summary of this transcript in English:

{text}

REQUIREMENTS:
1. Highlight the key points and main topics
2. Keep it clear and objective
3. Use bullet points for main takeaways
4. Maximum 3-4 paragraphs
5. Do not include personal commentary
6. Always output in English, even if the input is in another language
7. If translating, preserve the original meaning and context

Format the output as clean Markdown.`; 