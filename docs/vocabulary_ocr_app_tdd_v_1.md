# Vocabulary OCR Learning App

## Technical Design Document (TDD v1)

---

## Revision History

| Version | Date       | Changes                                                                        |
|---------|------------|--------------------------------------------------------------------------------|
| 1.0     | 2026-02-25 | Initial draft                                                                  |
| 1.1     | 2026-03-04 | Added vocab_lists table; updated vocab_items with list_id; updated routes and folder structure |

---

# 0. Scope

This TDD covers the **Web MVP** only.

Core MVP features:
- Auth
- Upload / camera capture
- Client-side OCR
- Select word/phrase from OCR
- Pronunciation (TTS)
- Meaning/definition (provider + fallback)
- Named vocabulary lists
- Save card to a list
- Flashcard review (single or multiple lists) + basic tracking

Non-goals (MVP):
- Store images
- Auto language detection
- Advanced spaced repetition
- Mobile app

---

# 1. Tech Stack

## 1.1 Frontend / Web
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- UI components: optional shadcn/ui (later)

## 1.2 Backend / Data
- Supabase
  - Auth (email + password)
  - Postgres DB
  - Row Level Security (RLS)

## 1.3 OCR
- Tesseract.js (client-side)
  - Use Web Worker
  - Language packs: eng, fin, spa

## 1.4 Pronunciation
- Web Speech API (SpeechSynthesis)
  - Voice selection by language if available

## 1.5 Meaning / Definitions
- Provider-based approach:
  - English: dictionaryapi.dev (free, no API key)
  - Finnish/Spanish: empty by default — user fills in manually (MVP)
  - User can always edit meaning

---

# 2. System Architecture

Client-heavy MVP:
- OCR runs in browser (Web Worker)
- Image is never uploaded to backend
- Backend stores only vocabulary lists, items, and review stats

Flow:
1. User uploads or takes a photo in the browser
2. OCR worker returns bounding boxes + text
3. User selects one or multiple boxes
4. App composes selected text into a phrase
5. App fetches meaning using provider strategy
6. App uses Web Speech API for pronunciation
7. User selects a list and saves the card to Supabase
8. Review mode lets user pick one or more lists → flashcard session

---

# 3. Data Model (Supabase/Postgres)

## 3.1 Tables

### vocab_lists
- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid not null references auth.users(id) on delete cascade
- `name` text not null
- `created_at` timestamptz not null default now()

Indexes:
- index on (user_id, created_at desc)

### vocab_items
- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid not null references auth.users(id) on delete cascade
- `list_id` uuid not null references vocab_lists(id) on delete cascade
- `text` text not null
- `language` text not null check (language in ('en','fi','es'))
- `meaning` text not null default ''
- `source` text not null default 'ocr'
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()
- `review_count` int not null default 0
- `last_reviewed_at` timestamptz null

Indexes:
- index on (user_id, created_at desc)
- index on (list_id)

## 3.2 Triggers
- `updated_at` auto-update trigger on vocab_items

---

# 4. Security (RLS)

## 4.1 vocab_lists

Enable RLS on vocab_lists.

Policies:
- SELECT: USING (auth.uid() = user_id)
- INSERT: WITH CHECK (auth.uid() = user_id)
- UPDATE: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
- DELETE: USING (auth.uid() = user_id)

## 4.2 vocab_items

Enable RLS on vocab_items.

Policies:
- SELECT: USING (auth.uid() = user_id)
- INSERT: WITH CHECK (auth.uid() = user_id)
- UPDATE: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
- DELETE: USING (auth.uid() = user_id)

---

# 5. API Design

MVP uses **Supabase client directly** from Next.js (no custom API layer needed).

DB access logic lives in `/src/lib/db/`.

Later (Post-MVP): Next.js Route Handlers `/app/api/*` for central validation and rate limiting.

---

# 6. OCR Module Design

## 6.1 OCR Output Types

```ts
type OcrBox = {
  id: string
  text: string
  confidence: number
  bbox: { x: number; y: number; w: number; h: number }
}

type OcrResult = {
  language: 'en' | 'fi' | 'es'
  boxes: OcrBox[]
}
```

## 6.2 OCR Processing
- Tesseract worker in `/src/lib/ocr/tesseractWorker.ts`
- Load traineddata based on selected language
- Provide progress callbacks for UI (loading bar)

## 6.3 Selection Behaviour
- Single click selects one box
- Multi-select: toggle boxes on/off
- Compose text:
  - Sort selected boxes by y (top to bottom) then x (left to right)
  - Join with space
  - Trim

---

# 7. Meaning Provider Design

## 7.1 Interface

```ts
interface MeaningProvider {
  canHandle(lang: string): boolean
  getMeaning(text: string, lang: string): Promise<{ meaning: string; source: string }>
}
```

## 7.2 MeaningManager

```
getMeaning(text, lang):
  1. Find first provider where canHandle(lang) === true
  2. Attempt fetch
  3. On failure → return { meaning: '', source: 'manual' }
```

## 7.3 Providers

### EnglishDictionaryProvider
- Endpoint: dictionaryapi.dev
- Parse first definition into 1–2 short sentences
- Pick top sense only

### FiEsFallbackProvider
- Returns `{ meaning: '', source: 'manual' }` for MVP
- User fills in meaning manually
- Provider abstraction makes it easy to add real translation API later

---

# 8. Pronunciation (TTS)

## 8.1 Implementation
- `window.speechSynthesis`
- `new SpeechSynthesisUtterance(text)`
- Set `utterance.lang` based on selected language:
  - `en-US`
  - `fi-FI`
  - `es-ES`

## 8.2 Voice Selection
- Prefer matching language voice from `speechSynthesis.getVoices()`
- Fallback to system default if none found

## 8.3 UX
- Button label: "Play"
- Auto-play in flashcards: off by default (MVP)

---

# 9. Frontend Structure

## 9.1 Routes (App Router)

| Route             | Description                                              |
|-------------------|----------------------------------------------------------|
| `/login`          | Sign in / sign up                                        |
| `/capture`        | Camera / upload, OCR, selection, card preview, save      |
| `/book`           | All vocabulary lists (My Lists page)                     |
| `/book/[listId]`  | Items inside a specific list                             |
| `/review`         | Pick lists → flashcard session                           |

## 9.2 Page Responsibilities

### /capture
- Camera access button + file upload fallback
- Language selector (EN / FI / ES)
- OCR progress indicator
- Image + bounding box overlay
- Multi-select boxes
- Opens card preview (inline or modal)

### /capture — Card Preview
- Editable text
- Language
- Meaning fetch + editable field
- TTS button
- List selector dropdown (create new or pick existing)
- Save button

### /book
- List of all user lists
- Create new list button
- Click list → navigate to `/book/[listId]`
- Delete list

### /book/[listId]
- List name + item count
- Search by text
- Each item: text, language, meaning, edit / delete

### /review
- Checkbox list of user's lists
- Start session button
- Flashcard: front (word) / back (meaning + pronunciation)
- Again / Good buttons
- Session complete screen

---

# 10. Folder Layout

```
/src
  /app
    /(auth)
      /login
        page.tsx
    /(app)
      layout.tsx              ← nav shell
      /capture
        page.tsx
      /book
        page.tsx              ← all lists
        /[listId]
          page.tsx            ← items in list
      /review
        page.tsx
    layout.tsx                ← root layout
  /components
    /capture
      ImagePicker.tsx
      OcrOverlay.tsx
      SelectionBar.tsx
      CardPreview.tsx
    /book
      ListCard.tsx
      VocabItemRow.tsx
    /review
      Flashcard.tsx
      ListSelector.tsx
  /lib
    /supabase
      client.ts
      server.ts
    /db
      vocabItems.ts
      vocabLists.ts
    /ocr
      tesseractWorker.ts
      ocrTypes.ts
    /meaning
      providers.ts
      meaningManager.ts
    /tts
      speak.ts
  /types
    vocab.ts
```

---

# 11. Error Handling

MVP baseline:
- Standard UI states: idle / loading / success / error
- OCR errors: show retry message ("Try better lighting or higher contrast")
- Network errors (meaning fetch): fallback to empty, user edits manually
- DB errors: show toast, keep unsaved draft in local state

---

# 12. Testing Strategy

MVP minimum:
- Unit test: MeaningManager (provider selection, fallback)
- Unit test: selection compose ordering (sort by y then x, join)
- Manual test checklist for capture flow

Later:
- Playwright E2E for full capture → save → review flow

---

# 13. Deployment

- Vercel deployment from GitHub (automatic on push to main)
- Supabase project config via environment variables
- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No server secrets required for MVP.

---

# 14. Implementation Checklist (by Phase)

## Phase 1 — Foundation
- [ ] Next.js scaffold (TypeScript, Tailwind, App Router, src/)
- [ ] Supabase client helpers (client.ts, server.ts)
- [ ] Middleware: route protection
- [ ] Login page (email + password)
- [ ] Navigation shell (Capture / My Lists / Review + sign out)
- [ ] Placeholder pages for all routes
- [ ] DB schema: vocab_lists + vocab_items + RLS policies
- [ ] TypeScript types in vocab.ts

## Phase 2 — OCR & Capture
- [ ] Image file upload
- [ ] Camera access via browser
- [ ] Tesseract.js Web Worker setup
- [ ] Language selector
- [ ] OCR progress indicator
- [ ] Bounding box overlay rendering
- [ ] Single and multi-box selection
- [ ] Phrase composition from selection

## Phase 3 — Card Creation & Lists
- [ ] Card preview UI
- [ ] TTS pronunciation helper
- [ ] Meaning manager integration
- [ ] Create / rename / delete lists
- [ ] List selector in card preview
- [ ] Save card to Supabase

## Phase 4 — Meaning Providers
- [ ] MeaningProvider interface
- [ ] EnglishDictionaryProvider (dictionaryapi.dev)
- [ ] FiEsFallbackProvider (manual)
- [ ] MeaningManager with fallback logic
- [ ] Manual meaning edit in library

## Phase 5 — Flashcards
- [ ] Review setup page (pick lists)
- [ ] Fetch cards for selected lists
- [ ] Flashcard UI (flip animation)
- [ ] Again / Good buttons
- [ ] Update review_count + last_reviewed_at
- [ ] Session complete screen

---

End of TDD v1.1
