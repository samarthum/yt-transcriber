export function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}

export interface ChunkOptions {
    targetSize?: number;
    overlap?: number;
    maxLookAhead?: number;
    maxTokens?: number;
}

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export function chunkText(
    text: string,
    maxChunkSize: number = 12000,
    overlap: number = 500
): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;

        // If this isn't the last chunk, try to break at a natural point
        if (endIndex < text.length) {
            // Look for paragraph or sentence breaks within the overlap region
            const searchRegion = text.slice(endIndex - overlap, endIndex + overlap);

            // First try to break at paragraph
            const paragraphs = searchRegion.match(/\n\s*\n/g);
            if (paragraphs) {
                const lastParagraph = paragraphs[paragraphs.length - 1];
                const paragraphEnd = searchRegion.lastIndexOf(lastParagraph) + lastParagraph.length;
                endIndex = (endIndex - overlap) + paragraphEnd;
            } else {
                // If no paragraphs, try sentences
                const sentences = searchRegion.match(/[.!?]+\s+/g);
                if (sentences) {
                    const lastSentence = sentences[sentences.length - 1];
                    const sentenceEnd = searchRegion.lastIndexOf(lastSentence) + lastSentence.length;
                    endIndex = (endIndex - overlap) + sentenceEnd;
                }
            }
        } else {
            endIndex = text.length;
        }

        chunks.push(text.slice(startIndex, endIndex).trim());
        startIndex = endIndex;
    }

    return chunks;
}

export function extractHeadings(markdown: string): Array<{ id: string, text: string, level: number }> {
    const headings: Array<{ id: string, text: string, level: number }> = [];
    const lines = markdown.split('\n');

    // Add "Key Takeaways" as the first heading
    headings.push({
        id: 'key-takeaways',
        text: 'Key Takeaways',
        level: 2
    });

    lines.forEach((line) => {
        // Match only ## and ### headings (level 2 and 3)
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();

            // Create a URL-friendly ID
            const id = text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            headings.push({ id, text, level });
        }
    });

    return headings;
} 