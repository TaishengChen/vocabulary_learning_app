# Phase 3 — Card Creation & Lists

## Goal
Build the card preview screen and the vocabulary lists system. By the end of this phase, a user can save a word/phrase to a named list, manage their lists, and view items inside each list.

## Prerequisites
- Phase 1 complete (auth, routes, DB schema)
- Phase 2 complete (OCR selection produces composed text)

---

## Tasks

### T1 — Create DB helper functions

**Why:** We keep all database queries in `/src/lib/db/` so pages and components never write raw SQL or Supabase calls directly. This makes code easier to test and change.

**You do:** Create `src/lib/db/vocabLists.ts`:
```ts
// Functions to implement:
// - getLists(supabase): get all lists for current user
// - createList(supabase, name): create a new list
// - renameList(supabase, id, name): update list name
// - deleteList(supabase, id): delete list (items cascade)
```

Create `src/lib/db/vocabItems.ts`:
```ts
// Functions to implement:
// - getItemsByList(supabase, listId): get all items in a list
// - createItem(supabase, data): insert a new vocab item
// - updateItemMeaning(supabase, id, meaning): update meaning
// - deleteItem(supabase, id): delete an item
// - getItemsForReview(supabase, listIds): get items from multiple lists
// - updateReviewStats(supabase, id, rating): update review_count + last_reviewed_at
```

Each function takes the Supabase client as its first argument (so it works in both server and client contexts).

---

### T2 — Build the CardPreview component

**Why:** After OCR selection, the user needs to review/edit the text, hear pronunciation, and save to a list.

**You do:** Create `src/components/capture/CardPreview.tsx`

The component should show:
- **Text field** (editable, prefilled with composed text from OCR)
- **Language selector** (EN / FI / ES)
- **Pronunciation button** → plays TTS (call the `speak()` helper from Phase T3)
- **Meaning section:**
  - Shows "Loading..." while fetching
  - Shows fetched meaning (editable text area)
  - If empty, shows placeholder "Write a meaning..."
- **List selector:**
  - Dropdown showing existing lists
  - A "+ New list" option that shows a text input to create a new list inline
- **Save button** → saves to DB and navigates to `/book/[listId]`
- **Back button** → goes back to capture

Props:
```ts
interface Props {
  initialText: string
  language: Language
}
```

---

### T3 — Create the TTS helper

**Why:** We reuse pronunciation in both the capture flow and flashcard review. A single helper avoids repetition.

**You do:** Create `src/lib/tts/speak.ts`:
```ts
export function speak(text: string, language: Language): void {
  const utterance = new SpeechSynthesisUtterance(text)
  const langMap: Record<Language, string> = {
    en: 'en-US',
    fi: 'fi-FI',
    es: 'es-ES',
  }
  utterance.lang = langMap[language]

  // Prefer a matching voice if available
  const voices = window.speechSynthesis.getVoices()
  const match = voices.find(v => v.lang.startsWith(langMap[language]))
  if (match) utterance.voice = match

  window.speechSynthesis.cancel() // stop any current speech
  window.speechSynthesis.speak(utterance)
}
```

---

### T4 — Build the My Lists page

**Why:** Users need to see all their lists and create new ones.

**You do:** Update `src/app/(app)/book/page.tsx`

The page should:
- Fetch all lists from `getLists()`
- Show each list as a card: name + item count
- Clicking a list → navigates to `/book/[listId]`
- A "New List +" button → shows an input field → calls `createList()` → refreshes list
- Allow renaming a list (edit icon → inline input)
- Allow deleting a list (with a confirmation step)

Use `use client` directive since this page has interactive state.

---

### T5 — Build the List Detail page

**Why:** Users need to see and manage items inside a specific list.

**You do:** Update `src/app/(app)/book/[listId]/page.tsx`

The page should:
- Read the `listId` from the URL params
- Fetch the list name
- Fetch all items in the list using `getItemsByList()`
- Show each item as a row: text, language badge, meaning (editable), delete button
- A search input to filter items by text (client-side, no DB call)
- Back button → `/book`

When the user edits a meaning inline → call `updateItemMeaning()` on blur.

---

### T6 — Wire CardPreview into the capture page

**Why:** The capture page needs to pass the composed text and language to the CardPreview component and handle the save flow.

**You do:** Update `src/app/(app)/capture/page.tsx`

When the user clicks "Create Card →":
- Show the `CardPreview` component (replace the capture view, or use a slide-in panel)
- Pass `initialText` (composed text) and `language`
- After save → navigate to `/book/[listId]`

---

## Acceptance Criteria

Phase 3 is complete when ALL of the following are true:

- [ ] Card preview shows the selected text pre-filled
- [ ] Pronunciation button plays the text
- [ ] Meaning is fetched (or shows empty for FI/ES)
- [ ] User can select an existing list or create a new one inline
- [ ] Saving creates an item in Supabase and navigates to the list
- [ ] My Lists page shows all user lists
- [ ] Clicking a list shows all its items
- [ ] User can edit the meaning of an item
- [ ] User can delete an item
- [ ] User can create, rename, and delete lists

---

## Notes

- Creating a list inline in the card preview (without navigating away) gives a much better UX than redirecting to another page. Keep the user in the flow.
- Always confirm before deleting a list — it deletes all items inside it.

---

## Next Phase
[Phase 4 — Meaning Providers](./phase-4-meaning-providers.md)
