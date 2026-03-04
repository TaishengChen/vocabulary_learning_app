# Vocab Learning App

A responsive web application for learning vocabulary from real-world images. Take a photo or upload an image, run OCR directly in the browser, select words or phrases, and save them to personal vocabulary lists. Study with flashcards.

---

## Features

- **Camera & image capture** — take a photo or upload from your device
- **Client-side OCR** — text recognition runs in the browser (no image is uploaded to any server)
- **Word selection** — tap individual words or multiple boxes to build a phrase
- **Pronunciation** — listen to any word using the Web Speech API
- **Meanings** — auto-fetched for English words; manual input for Finnish and Spanish
- **Vocabulary lists** — create named lists and organise your saved cards
- **Flashcard review** — study one or multiple lists with a flip-card interface

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (Postgres + Row Level Security) |
| OCR | Tesseract.js (runs in browser via Web Worker) |
| Pronunciation | Web Speech API (built-in, no API key needed) |
| Dictionary | dictionaryapi.dev (English, free) |
| Deployment | Vercel + Supabase Cloud |

---

## Getting Started

### Prerequisites
- Node.js v18 or later
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/vocabulary-learning-app.git
cd vocabulary-learning-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project under **Settings → API**.

### 4. Set up the database

Run the SQL schema located in [`docs/vocabulary_ocr_app_tdd_v_1.md`](docs/vocabulary_ocr_app_tdd_v_1.md) (Section 3 — Data Model) in your Supabase **SQL Editor**.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
  app/
    (auth)/login/       # Sign in / sign up
    (app)/
      capture/          # Camera, OCR, word selection
      book/             # Vocabulary lists
        [listId]/       # Items inside a list
      review/           # Flashcard study session
  components/           # Reusable UI components
  lib/
    supabase/           # Supabase client helpers
    db/                 # Database query functions
    ocr/                # Tesseract.js worker
    meaning/            # Meaning provider system
    tts/                # Text-to-speech helper
  types/
    vocab.ts            # Shared TypeScript types
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD v1](docs/vocabulary_ocr_app_prd_v_1.md) | Product requirements |
| [TDD v1](docs/vocabulary_ocr_app_tdd_v_1.md) | Technical design |
| [Phase 1 — Foundation](docs/plan/phase-1-foundation.md) | Auth, routing, DB schema |
| [Phase 2 — OCR & Capture](docs/plan/phase-2-ocr-capture.md) | Camera, Tesseract.js, selection |
| [Phase 3 — Card & Lists](docs/plan/phase-3-card-lists.md) | Card creation, list management |
| [Phase 4 — Meaning Providers](docs/plan/phase-4-meaning-providers.md) | Dictionary integration |
| [Phase 5 — Flashcards](docs/plan/phase-5-flashcards.md) | Flashcard review system |

---

## Roadmap

- [x] Phase 1 — Foundation (auth, routing, database)
- [ ] Phase 2 — OCR & Capture
- [ ] Phase 3 — Card Creation & Lists
- [ ] Phase 4 — Meaning Providers
- [ ] Phase 5 — Flashcards

---

## License

MIT
