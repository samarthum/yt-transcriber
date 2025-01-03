export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message)
        this.name = 'AppError'
    }
}

export class AuthError extends AppError {
    constructor(message: string) {
        super(message, 'AUTH_ERROR', 401)
    }
}

export class TranscriptError extends AppError {
    constructor(message: string) {
        super(message, 'TRANSCRIPT_ERROR', 404)
    }
}

export class VideoError extends AppError {
    constructor(message: string) {
        super(message, 'VIDEO_ERROR', 400)
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 'DATABASE_ERROR', 500)
    }
} 