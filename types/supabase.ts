export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    updated_at?: string
                }
            }
            transcripts: {
                Row: {
                    id: string
                    user_id: string
                    video_id: string
                    video_title: string
                    channel_name: string
                    thumbnail_url: string | null
                    structured_content: string
                    summary: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    video_id: string
                    video_title: string
                    channel_name: string
                    thumbnail_url?: string | null
                    structured_content: string
                    summary: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    video_title?: string
                    thumbnail_url?: string | null
                    structured_content?: string
                    summary?: string
                    updated_at?: string
                }
            }
        }
    }
}