# Vacation Planner

AI-powered vacation planning assistant built with React, Vite, Hono, and Cloudflare Workers.

## Demo

Try it out: **[https://cf-ai-kevinsong.kevins11373.workers.dev/](https://cf-ai-kevinsong.kevins11373.workers.dev/)**

## Features

- Chat-based vacation planning with AI assistance
- Passkey-based authentication for chat history persistence
- Real-time conversation with persistent storage
- Deployed on Cloudflare Workers edge network

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

## Building

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

> **Note:** The build and preview commands work without a Cloudflare account. However, some features (like AI chat and KV storage) require Cloudflare Workers and won't work in local preview mode.

## Deployment

To deploy your own instance, you'll need a Cloudflare account with Workers enabled:

1. Set up your Cloudflare account and create KV namespaces
2. Update `wrangler.json` with your own KV namespace IDs
3. Deploy:

```bash
npm run build && npm run deploy
```

Monitor workers:

```bash
npx wrangler tail
```

## Tech Stack

- React - UI library
- Vite - Build tool
- Hono - Backend framework
- Cloudflare Workers - Edge computing platform
- Cloudflare KV - Key-value storage
- Cloudflare AI - AI model integration
