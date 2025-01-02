export const TRANSCRIPT_FORMAT_PROMPT = `Rewrite this transcript text as well-structured Markdown in English:

{text}

REQUIREMENTS:
1. Format the content into clear, readable paragraphs with natural transitions
2. Use ## for major topic changes or significant shifts in conversation
3. Focus on flowing narrative paragraphs rather than bullet points
4. Use bullet points sparingly and only when listing:
   - Multiple distinct speakers
   - Explicit step-by-step instructions
5. Break long discussions into digestible paragraphs with clear topic sentences
6. Preserve speaker names if present (in **bold**)
7. Maintain chronological flow and conversational context
8. Always output in English, even if the input is in another language
9. If translating, maintain accuracy and natural flow

Format the output as clean, narrative-focused Markdown.`;

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