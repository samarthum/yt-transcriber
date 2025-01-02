# YouTube Transcript Processor

A powerful web application that processes YouTube video transcripts using AI to create structured, readable content with summaries and navigation. Built with Next.js, TypeScript, and Claude AI.

## Features

- **Transcript Processing**: Automatically fetches and processes YouTube video transcripts
- **AI-Powered Formatting**: Converts raw transcripts into well-structured, readable content
- **Smart Summaries**: Generates concise summaries of video content
- **Interactive Navigation**: 
  - Table of contents with smooth scrolling
  - Progress tracking for long videos
  - Responsive sidebar for easy navigation
- **Mobile-Friendly**: Fully responsive design with a mobile-optimized navigation menu
- **Real-Time Progress**: Shows processing progress and current steps
- **Error Handling**: Robust error handling with user-friendly error messages

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Processing**: Claude 3.5 (Anthropic)
- **APIs**: YouTube Data API, YouTube Transcript API
- **State Management**: React Hooks
- **Typography**: Inter (sans-serif) and Source Serif 4 (serif) fonts

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- YouTube API Key
- Anthropic API Key (Claude)


## Usage

1. Paste a YouTube URL into the input field
2. Click "Process" to start the transcript analysis
3. Wait for the AI to process the content
4. Navigate the processed content using the sidebar
5. Read the summary and structured transcript

## Architecture

### Key Components

- **VideoSearch**: Handles URL input and processing initiation
- **TranscriptContent**: Displays processed transcript and summary
- **Sidebar**: Provides navigation through processed content
- **VideoInfoCard**: Shows video metadata and thumbnail

### Services

- **AIService**: Handles AI processing using Claude
- **TranscriptService**: Manages transcript fetching and processing
- **VideoService**: Handles YouTube video information retrieval
- **ServiceFactory**: Manages service instantiation and configuration

### Error Handling

The application includes comprehensive error handling for:
- Invalid YouTube URLs
- Failed transcript fetches
- AI processing errors
- API rate limits
- Network issues

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Anthropic's Claude](https://www.anthropic.com/)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
