# Vacation Planner

AI-powered vacation planning assistant built with React, Vite, Hono, and Cloudflare Workers.

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

## Production

Build for production:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

Deploy to Cloudflare Workers:

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
