# Vocabulary Learning App

A full-stack web application for learning vocabulary from real-world images. Point your camera at a book, menu, or sign — the app recognises the text directly in your browser, lets you select words, and saves them as personal flashcards. Study later with a flip-card review session.

> **Portfolio project** — built with a phased engineering plan, documented architecture decisions, and production-ready deployment on Vercel + Supabase.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Phases](#development-phases)
- [Key Design Decisions](#key-design-decisions)
- [Documentation](#documentation)
- [License](#license)

---

## Live Demo

> _Coming soon — will be deployed to Vercel_

---

## Features

### Implemented (Phases 1–3)

| Feature | Description |
|---------|-------------|
| **Authentication** | Email + password sign-up and sign-in powered by Supabase Auth |
| **Route protection** | Server-side auth guard redirects unauthenticated users to login |
| **Camera capture** | Native camera access on mobile; file upload on desktop |
| **Client-side OCR** | Text recognition runs entirely in the browser using Tesseract.js — no image is ever sent to a server |
| **Multi-language OCR** | Supports English, Finnish, and Spanish recognition |
| **Interactive word selection** | Each detected word gets a clickable bounding box; tap single words or multiple boxes to compose a phrase |
| **Pronunciation** | Listen to any word instantly using the Web Speech API (no API key, no cost) |
| **Card editor** | Edit the OCR text, choose the language, write a meaning, and assign the card to a list before saving |
| **Vocabulary lists** | Create named lists to organise your cards by topic, book, or course |
| **List management** | Rename and delete lists with confirmation; view all cards inside a list |
| **Inline editing** | Edit a card's meaning directly on the list detail page |
| **Search / filter** | Filter items in a list by typing in a search box |
| **Data isolation** | Row Level Security (RLS) ensures each user can only access their own data |

### Planned (Phases 4–5)

| Feature | Description |
|---------|-------------|
| **Auto meanings** | English definitions from dictionaryapi.dev; Finnish and Spanish translations from MyMemory API |
| **Flashcard review** | Flip-card interface with session progress tracking |
| **Review statistics** | Track how many times each card has been reviewed and when |

---

## How It Works

```
1. Open camera or upload image
        │
        ▼
2. Tesseract.js (Web Worker) runs OCR in the browser
   → Detects text and returns bounding boxes for each word
        │
        ▼
3. Bounding boxes are drawn over the image
   → User taps words to select them
   → Multi-word selections are sorted by position and joined
        │
        ▼
4. Card editor opens
   → Pre-filled with the selected text
   → User edits text, picks language, writes meaning
   → Pronunciation button speaks the word aloud
   → User assigns card to an existing list (or creates a new one)
        │
        ▼
5. Card is saved to Supabase Postgres
   → Original image is discarded — never stored anywhere
        │
        ▼
6. Review cards with flashcards (Phase 5)
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 16 (App Router) + TypeScript | Server components, file-based routing, edge middleware, easy Vercel deployment |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive, no separate CSS files to maintain |
| **Auth & Database** | Supabase (Postgres + Auth + RLS) | Managed Postgres with built-in auth, row-level security, and a generous free tier |
| **OCR** | Tesseract.js 7 (Web Worker) | Runs 100% client-side — privacy-preserving, no server cost, supports 100+ languages |
| **Pronunciation** | Web Speech API | Built into every modern browser — no API key, no cost, language-specific voices |
| **Dictionary** | dictionaryapi.dev | Free English dictionary API, no key required |
| **Translation** | MyMemory API | Free translation API for Finnish and Spanish |
| **Deployment** | Vercel + Supabase Cloud | Zero-config deployment from GitHub; auto-preview deployments on each PR |

---

## Architecture

```
Browser (Client)
├── Next.js App Router pages (React Server Components + Client Components)
├── Tesseract.js Web Worker  ← OCR runs here, image never leaves the device
├── Web Speech API           ← TTS runs here, no external calls
└── Supabase JS Client       ← Talks directly to Supabase (no custom API server)

Edge (Vercel)
└── proxy.ts (Next.js middleware)  ← Auth guard, redirects unauthenticated requests

Supabase Cloud
├── Postgres Database
│   ├── vocab_lists table
│   └── vocab_items table
├── Auth (email + password)
└── Row Level Security policies  ← Each user sees only their own data
```

**No custom backend server.** Next.js talks directly to Supabase from the browser. This keeps the architecture simple and the infrastructure cost at zero.

---

## Database Schema

### `vocab_lists`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Auto-generated |
| `user_id` | `uuid` (FK → auth.users) | Owner of the list |
| `name` | `text` | Display name for the list |
| `created_at` | `timestamptz` | Creation timestamp |

### `vocab_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Auto-generated |
| `user_id` | `uuid` (FK → auth.users) | Owner of the card |
| `list_id` | `uuid` (FK → vocab_lists) | Parent list (`ON DELETE CASCADE`) |
| `text` | `text` | The word or phrase |
| `language` | `'en' \| 'fi' \| 'es'` | Language of the word |
| `meaning` | `text` | Definition or translation |
| `source` | `text` | Where the meaning came from |
| `review_count` | `int` | Times reviewed (default 0) |
| `last_reviewed_at` | `timestamptz \| null` | Last review timestamp |
| `created_at` | `updated_at` | Managed automatically |

**Row Level Security** is enabled on both tables. Policies ensure:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` are only allowed when `user_id = auth.uid()`

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Root → redirects to /capture
│   ├── layout.tsx                  # Root HTML layout + metadata
│   ├── globals.css                 # Tailwind v4 + CSS variables
│   │
│   ├── (auth)/
│   │   └── login/page.tsx          # Sign in / sign up form
│   │
│   └── (app)/                      # Protected routes (require auth)
│       ├── layout.tsx              # Navigation shell (Capture / My Lists / Review / Sign out)
│       ├── capture/page.tsx        # Camera → OCR → word selection flow
│       ├── book/
│       │   ├── page.tsx            # All vocabulary lists
│       │   └── [listId]/page.tsx   # Cards inside one list
│       └── review/page.tsx         # Flashcard review (Phase 5)
│
├── components/
│   └── capture/
│       ├── ImagePicker.tsx         # Camera + upload buttons
│       ├── OcrOverlay.tsx          # Image with clickable bounding boxes
│       ├── SelectionBar.tsx        # Sticky footer: selected text + actions
│       └── CardPreview.tsx         # Card editor: text, language, meaning, save
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (cookie-based)
│   ├── db/
│   │   ├── vocabLists.ts           # getLists, createList, renameList, deleteList
│   │   └── vocabItems.ts           # getItemsByList, createItem, updateItemMeaning,
│   │                               # deleteItem, getItemsForReview, updateReviewStats
│   ├── ocr/
│   │   ├── ocrTypes.ts             # OcrBox, OcrResult interfaces
│   │   └── tesseractWorker.ts      # Tesseract.js integration + TSV → bounding box parser
│   └── tts/
│       └── speak.ts                # Web Speech API wrapper (language-specific voices)
│
├── types/
│   └── vocab.ts                    # Language, VocabList, VocabItem TypeScript types
│
└── proxy.ts                        # Auth middleware — redirects based on session state

docs/
├── vocabulary_ocr_app_prd_v_1.md   # Product requirements document
├── vocabulary_ocr_app_tdd_v_1.md   # Technical design document
└── plan/
    ├── phase-1-foundation.md       # Auth, routing, DB schema
    ├── phase-2-ocr-capture.md      # OCR flow implementation
    ├── phase-3-card-lists.md       # Card editor, list management
    ├── phase-4-meaning-providers.md# Dictionary + translation APIs
    └── phase-5-flashcards.md       # Flashcard review system
```

---

## Getting Started

### Prerequisites

- **Node.js v18** or later
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

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **anon public key** from **Settings → API**.

### 4. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set up the database

Open the **SQL Editor** in your Supabase dashboard and run the following schema:

```sql
-- Vocabulary lists
create table vocab_lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table vocab_lists enable row level security;

create policy "Users manage own lists"
  on vocab_lists for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Vocabulary items
create table vocab_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  list_id          uuid not null references vocab_lists(id) on delete cascade,
  text             text not null,
  language         text not null check (language in ('en', 'fi', 'es')),
  meaning          text not null default '',
  source           text not null default '',
  review_count     int not null default 0,
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table vocab_items enable row level security;

create policy "Users manage own items"
  on vocab_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

> For the complete and authoritative schema, see [docs/vocabulary_ocr_app_tdd_v_1.md](docs/vocabulary_ocr_app_tdd_v_1.md).

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page automatically.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build the app for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## Development Phases

This project was built in five planned phases. Each phase has a detailed engineering plan in `/docs/plan/`.

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Foundation — auth, routing, DB schema, nav shell | ✅ Complete |
| 2 | OCR & Capture — camera, Tesseract.js, word selection | ✅ Complete |
| 3 | Card Creation & Lists — card editor, list management | ✅ Complete |
| 4 | Meaning Providers — auto dictionary + translation | 🔜 Next |
| 5 | Flashcards — flip-card review session | 🔜 Planned |

---

## Key Design Decisions

**Privacy-first OCR**
Images are processed entirely in the browser using a Tesseract.js Web Worker. The original image is discarded immediately after OCR completes — it is never uploaded to any server or stored anywhere. Only the extracted text is saved.

**No custom API server**
Next.js communicates directly with Supabase from the browser. Supabase's Row Level Security policies enforce data ownership at the database level, so a separate backend is not needed. This keeps the infrastructure simple and the cost at zero.

**Client-side pronunciation**
The Web Speech API is built into every modern browser. Using it means no API keys, no usage limits, and no latency from a network call — the word plays instantly.

**Phased development**
The project is split into five phases with written engineering plans before coding each one. This demonstrates planning, architecture thinking, and the ability to scope and prioritise work — skills that matter in a professional team.

**No spaced repetition in MVP**
Spaced repetition (SRS) is a popular feature in vocabulary apps but adds significant complexity. For the MVP the focus is on the core loop: capture → save → review. SRS can be added later if needed.

**Each card belongs to exactly one list**
A simple ownership model. Cards can be moved between lists, but they cannot belong to multiple lists. This avoids complex many-to-many joins while still allowing good organisation.

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD v1](docs/vocabulary_ocr_app_prd_v_1.md) | Product requirements — goals, user stories, success criteria |
| [TDD v1](docs/vocabulary_ocr_app_tdd_v_1.md) | Technical design — architecture, data model, API design |
| [Phase 1 — Foundation](docs/plan/phase-1-foundation.md) | Auth, routing, DB schema, nav shell |
| [Phase 2 — OCR & Capture](docs/plan/phase-2-ocr-capture.md) | Camera, Tesseract.js, bounding boxes, word selection |
| [Phase 3 — Card & Lists](docs/plan/phase-3-card-lists.md) | Card editor, vocabulary list management |
| [Phase 4 — Meaning Providers](docs/plan/phase-4-meaning-providers.md) | Dictionary API + translation integration |
| [Phase 5 — Flashcards](docs/plan/phase-5-flashcards.md) | Flashcard review session design |

---

## License

MIT
