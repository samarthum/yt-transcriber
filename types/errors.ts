export class AppError extends Error {
    constructor(
        public message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class VideoError extends AppError {
    constructor(message: string) {
        super(message, 'VIDEO_ERROR', 400);
    }
}

export class TranscriptError extends AppError {
    constructor(message: string) {
        super(message, 'TRANSCRIPT_ERROR', 404);
    }
}

export class AIServiceError extends AppError {
    constructor(message: string) {
        super(message, 'AI_SERVICE_ERROR', 500);
    }
} 