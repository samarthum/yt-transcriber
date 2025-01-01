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

export function chunkText(text: string, maxChunkSize: number = 8000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;

        // If this isn't the last chunk, try to break at a sentence
        if (endIndex < text.length) {
            // Look for sentence endings within the overlap region
            const searchRegion = text.slice(endIndex - overlap, endIndex + overlap);
            const sentences = searchRegion.match(/[.!?]+\s+/g);

            if (sentences) {
                // Find the last sentence ending in our search region
                const lastSentence = sentences[sentences.length - 1];
                const sentenceEnd = searchRegion.lastIndexOf(lastSentence) + lastSentence.length;
                endIndex = (endIndex - overlap) + sentenceEnd;
            }
        } else {
            endIndex = text.length;
        }

        chunks.push(text.slice(startIndex, endIndex));
        startIndex = endIndex;
    }

    return chunks;
} 