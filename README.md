# Hisako Digital Demo

A live lead qualification bot and demo environment for Hisako Digital.

## Prerequisites
- Node 18+
- Anthropic API key (or Gemini API key depending on your configuration)

## Setup Steps
1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and add your Anthropic API key (as `GEMINI_API_KEY`)
4. `npm run dev`
5. Open http://localhost:3000

## Deployment
Push to GitHub, connect to Vercel, add `GEMINI_API_KEY` as environment variable in Vercel dashboard.

**Note:** Quick-test buttons in the left panel let you test qualification sequences without typing.
