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

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
    const {
        targetSize = 1000,
        overlap = 100,
        maxLookAhead = 50,
        maxTokens = 4000
    } = options;

    const words = text.split(/(\s+)/).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let wordCount = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const potentialChunk = [...currentChunk, word].join('');

        if (!word.match(/^\s+/)) {
            wordCount++;
        }

        if (wordCount >= targetSize || estimateTokens(potentialChunk) >= maxTokens) {
            // Look for a good breaking point
            let lookAhead = 0;
            while (i + lookAhead < words.length && lookAhead < maxLookAhead) {
                if (words[i + lookAhead].match(/[.!?]\s*$/)) {
                    i += lookAhead;
                    break;
                }
                lookAhead++;
            }

            // Add remaining words up to break point
            while (lookAhead > 0) {
                currentChunk.push(words[++i]);
                lookAhead--;
            }

            chunks.push(currentChunk.join(''));

            // Start new chunk with overlap
            const overlapStart = Math.max(0, currentChunk.length - overlap);
            currentChunk = currentChunk.slice(overlapStart);
            wordCount = countWords(currentChunk.join(''));
        } else {
            currentChunk.push(word);
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(''));
    }

    return chunks;
} 