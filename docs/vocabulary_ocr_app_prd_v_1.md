# Vocabulary OCR Learning App

## Product Requirements Document (PRD v1)

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
- Email login (Magic link or password)
- Private user accounts
- All vocabulary data is user-scoped

---

## 4.2 Capture & OCR

User can:
- Upload an image
- Take a photo via browser camera
- Select OCR language (EN / FI / ES)

System will:
- Run OCR using client-side engine
- Render selectable text boxes over image
- Allow single or multi-selection
- Merge selected text into phrase

Images are discarded after OCR (not stored in cloud).

---

## 4.3 Card Creation

After selecting text:

User sees Card Preview screen:
- Editable text field
- Language selector
- Meaning panel
- Pronunciation button
- Save button

Pronunciation:
- Uses Web Speech API (browser-based TTS)

Meaning strategy:
- English: dictionary API
- Finnish & Spanish: translation-based meaning
- Manual editing always available

---

## 4.4 My Book (Library)

User can:
- View saved vocabulary list
- Search by text
- Filter by language

---

## 4.5 Flashcard Mode

Review session includes:
- Front: word/phrase
- Back: meaning
- Pronunciation button
- Buttons: Again / Good

System tracks:
- review_count
- last_reviewed_at

Spaced repetition algorithm is NOT included in MVP.

---

# 5. Data Model (MVP)

Table: vocab_items

Fields:
- id (uuid)
- user_id (foreign key)
- text (string)
- language (enum: en | fi | es)
- meaning (string)
- source (default: "ocr")
- created_at (timestamp)
- review_count (integer)
- last_reviewed_at (timestamp)

No image storage.

---

# 6. Non-Goals (Out of Scope for MVP)

- Automatic language detection
- Advanced spaced repetition algorithm
- Offline mode
- AI sentence generation
- Mobile app (web first)
- Collaborative or shared books

---

# 7. Technical Architecture (MVP)

Frontend:
- Next.js + TypeScript

Backend & Database:
- Supabase (Auth + Postgres + RLS)

OCR:
- Tesseract.js (client-side)

Pronunciation:
- Web Speech API

Meaning Providers:
- English dictionary API
- Translation fallback for FI / ES

---

# 8. Milestones

## Milestone 1 — Foundation
- Project scaffold
- Supabase integration
- Auth
- Protected routes

## Milestone 2 — OCR Flow
- Upload
- Camera capture
- OCR processing
- Text selection UI

## Milestone 3 — Card System
- Card preview
- Pronunciation
- Save to database
- Library page

## Milestone 4 — Meaning Providers
- English dictionary integration
- FI/ES fallback strategy
- Manual meaning edit

## Milestone 5 — Flashcards
- Review UI
- Again / Good logic
- Review tracking

---

# 9. Success Criteria (MVP)

A user can:
1) Upload or take a photo
2) Select text from OCR
3) Hear pronunciation
4) See a meaning
5) Save the card
6) Review it in flashcard mode

All within a private account environment.

---

End of PRD v1

