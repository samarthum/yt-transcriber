export const TRANSCRIPT_FORMAT_PROMPT = `Rewrite this transcript text as well-structured Markdown in English:

{text}

REQUIREMENTS:
1. Use ## for main sections and ### for subsections
2. Each section must have a clear title and content
3. Format with proper paragraphs and lists
4. Preserve all important information
5. Do not add any commentary
6. Always output in English, even if the input is in another language
7. If translating, maintain accuracy and context

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