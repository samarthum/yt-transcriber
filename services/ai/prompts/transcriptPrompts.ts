export const TRANSCRIPT_FORMAT_PROMPT = `Rewrite this transcript text as well-structured Markdown in English:

{text}

REQUIREMENTS:
1. Format the content into clear, readable paragraphs
2. Use ## for main topic changes or significant shifts in conversation
3. Use proper sentences and maintain natural flow
4. Use bullet points ONLY for:
   - Lists of items or steps
   - Key points within a section
   - Multiple speakers' names
5. Break long discussions into digestible paragraphs
6. Preserve speaker names if present (in bold)
7. Maintain chronological flow and context
8. Always output in English, even if the input is in another language
9. If translating, maintain accuracy and context

Format the output as clean Markdown only.`;

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