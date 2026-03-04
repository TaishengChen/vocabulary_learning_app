# Vocabulary OCR Learning App

## Product Requirements Document (PRD v1)

---

## Revision History

| Version | Date       | Changes                                                              |
|---------|------------|----------------------------------------------------------------------|
| 1.0     | 2026-02-25 | Initial draft                                                        |
| 1.1     | 2026-03-04 | Added vocab lists (named collections); updated data model and routes |

---

# 1. Product Overview

## 1.1 Vision
Enable users to instantly capture vocabulary from real-world images and convert them into structured flashcards for personal learning.

## 1.2 Core Value Proposition
From image → selectable text → pronunciation → meaning → saved card → flashcard review.

Target completion time per capture: under 10 seconds.

---

# 2. Target Users

Anyone learning vocabulary, slang, phrases, idioms, or expressions in English, Finnish, or Spanish.

Initial focus:
- Language learners
- Students
- Self-learners

---

# 3. MVP Scope

## 3.1 Supported Languages
- English (EN)
- Finnish (FI)
- Spanish (ES)

Language selection is manual (no automatic detection in MVP).

---

# 4. Core Features

## 4.1 Authentication
- Email + password login
- Private user accounts
- All vocabulary data is user-scoped

---

## 4.2 Capture & OCR

User can:
- Take a photo directly in the browser (camera access, like Google Translate)
- Or upload an image from their device
- Select OCR language (EN / FI / ES)

System will:
- Run OCR using client-side engine (no image sent to server)
- Render selectable text boxes over image
- Allow single or multi-box selection
- Merge selected text into a phrase

Images are discarded after OCR (not stored in cloud).

---

## 4.3 Card Creation

After selecting text, user sees the Card Preview screen:
- Editable text field (prefilled from selection)
- Language selector
- Meaning panel (auto-fetched, manually editable)
- Pronunciation button (plays TTS)
- List selector (choose which list to save to)
- Save button

Pronunciation:
- Uses Web Speech API (browser-based TTS, no external API needed)

Meaning strategy:
- English: free dictionary API (dictionaryapi.dev)
- Finnish & Spanish: empty by default — user types meaning manually (MVP)
- Manual editing always available for all languages

---

## 4.4 My Lists (Vocabulary Library)

Users can create and manage named vocabulary lists.

### List management
User can:
- Create a new list (requires a name)
- Rename a list
- Delete a list (deletes all items in it)
- View all their lists on the My Lists page

### Item management (within a list)
User can:
- View all saved items in a list
- Search by text within a list
- Edit the meaning of an item
- Delete an item

One item belongs to exactly one list.

---

## 4.5 Flashcard Mode

User can:
- Select one or multiple lists to review in a single session
- Start a flashcard session with the selected items

Review session:
- Front: word/phrase
- Back: meaning
- Pronunciation button
- Buttons: Again / Good

System tracks per item:
- review_count
- last_reviewed_at

Spaced repetition algorithm is NOT included in MVP.

---

# 5. Data Model (MVP)

## Table: vocab_lists

| Field      | Type      | Notes                          |
|------------|-----------|--------------------------------|
| id         | uuid      | primary key                    |
| user_id    | uuid      | foreign key → auth.users       |
| name       | text      | required, e.g. "Finnish Signs" |
| created_at | timestamp |                                |

## Table: vocab_items

| Field           | Type      | Notes                            |
|-----------------|-----------|----------------------------------|
| id              | uuid      | primary key                      |
| user_id         | uuid      | foreign key → auth.users         |
| list_id         | uuid      | foreign key → vocab_lists        |
| text            | text      | the word or phrase               |
| language        | enum      | en / fi / es                     |
| meaning         | text      | auto-fetched or manually written |
| source          | text      | default: "ocr"                   |
| created_at      | timestamp |                                  |
| updated_at      | timestamp |                                  |
| review_count    | integer   | default: 0                       |
| last_reviewed_at| timestamp | nullable                         |

No image storage.

---

# 6. Non-Goals (Out of Scope for MVP)

- Automatic language detection
- Advanced spaced repetition algorithm
- Offline mode
- AI-generated meanings or sentence examples
- Mobile app (web first, mobile later)
- Collaborative or shared lists

---

# 7. Technical Architecture (MVP)

Frontend:
- Next.js + TypeScript + Tailwind CSS

Backend & Database:
- Supabase (Auth + Postgres + Row Level Security)

OCR:
- Tesseract.js (runs in the browser, no server needed)

Pronunciation:
- Web Speech API (built into modern browsers, free)

Meaning Providers:
- English: dictionaryapi.dev (free, no key needed)
- Finnish & Spanish: manual input (MVP)

Deployment:
- Vercel (frontend)
- Supabase cloud (database + auth)

---

# 8. Milestones

## Milestone 1 — Foundation
- Next.js project scaffold
- Supabase integration (auth + DB schema)
- Protected routes (middleware)
- Navigation shell

## Milestone 2 — OCR & Capture
- Camera access + file upload
- Tesseract.js OCR with language selection
- Text bounding box overlay on image
- Multi-box selection + phrase composition

## Milestone 3 — Card Creation & Lists
- Card preview screen
- Pronunciation (Web Speech API)
- List management (create / rename / delete)
- Save card to selected list

## Milestone 4 — Meaning Providers
- English dictionary API integration
- Provider pattern (easy to extend later)
- Manual meaning editing

## Milestone 5 — Flashcards
- Select one or multiple lists to review
- Flashcard UI (front / back flip)
- Again / Good logic
- Update review_count and last_reviewed_at

---

# 9. Success Criteria (MVP)

A user can:
1. Sign up and log in
2. Create a named vocabulary list
3. Take a photo or upload an image
4. Select text from the OCR result
5. Hear the pronunciation
6. See or write a meaning
7. Save the card to a list
8. Review the list in flashcard mode

All within a private, secure account.

---

End of PRD v1.1
