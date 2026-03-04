# Phase 5 — Flashcards

## Goal
Build the flashcard review system. Users choose one or more vocabulary lists, then review them card by card. Each card shows the word on the front and the meaning on the back. After reviewing, the system records the result.

## Prerequisites
- Phase 1–4 complete
- `vocab_items` table has real data (saved cards from Phase 3)

---

## Background: How the Review Works

This is a simplified flashcard system — no spaced repetition algorithm in MVP.

1. User selects which lists to review
2. App loads all items from those lists
3. For each card:
   - Front: word/phrase + pronunciation button
   - User flips the card
   - Back: meaning + pronunciation button
   - User clicks "Good" (understood) or "Again" (need to review again)
4. At the end: session complete screen with count of cards reviewed

When the user clicks "Good" or "Again":
- `review_count` increments by 1
- `last_reviewed_at` updates to now

---

## Tasks

### T1 — Build the ListSelector component

**Why:** Before starting a session, the user picks which lists to include.

**You do:** Create `src/components/review/ListSelector.tsx`

The component should:
- Show all the user's lists with a checkbox next to each
- Show item count per list
- A "Start Review" button (disabled if no list is selected)
- Show total number of cards selected (sum of items from checked lists)

Props:
```ts
interface Props {
  lists: VocabList[]
  itemCounts: Record<string, number>
  onStart: (selectedListIds: string[]) => void
}
```

---

### T2 — Build the Flashcard component

**Why:** The card needs a flip animation to reveal the meaning. This is the most visually engaging part of the app.

**You do:** Create `src/components/review/Flashcard.tsx`

The component should:
- Show the **front** by default: word/phrase + language badge + pronunciation button
- On click → flip to show the **back**: meaning + pronunciation button
- CSS 3D flip animation (use Tailwind or plain CSS)
- After flip, show "Again" and "Good" buttons

Props:
```ts
interface Props {
  item: VocabItem
  onRate: (rating: 'again' | 'good') => void
}
```

The flip should be triggered by clicking anywhere on the card.

CSS flip pattern:
```css
.card { transform-style: preserve-3d; transition: transform 0.4s; }
.card.flipped { transform: rotateY(180deg); }
.card-front { backface-visibility: hidden; }
.card-back { backface-visibility: hidden; transform: rotateY(180deg); }
```

---

### T3 — Build the review page

**Why:** This page manages the full session state — which cards, current index, and completion.

**You do:** Update `src/app/(app)/review/page.tsx`

States:
```ts
type ReviewState = 'setup' | 'reviewing' | 'complete'
```

`setup` state:
- Show `ListSelector`
- On "Start Review" → fetch items for selected lists → shuffle → go to `reviewing`

`reviewing` state:
- Show current card index (e.g. "3 / 12")
- Show `Flashcard` component with current item
- On rate:
  - Call `updateReviewStats(id, rating)` in the background (don't wait — don't block the UI)
  - Move to next card
  - If last card → go to `complete`

`complete` state:
- Show "Session complete!" message
- Show: X cards reviewed, X marked "Good", X marked "Again"
- Buttons: "Review again" (same lists) or "Back to My Lists"

---

### T4 — Implement updateReviewStats DB function

**Why:** We need to persist the review results to the DB.

**You do:** Add to `src/lib/db/vocabItems.ts`:

```ts
async function updateReviewStats(
  supabase: SupabaseClient,
  id: string,
  rating: 'again' | 'good'
): Promise<void> {
  await supabase
    .from('vocab_items')
    .update({
      review_count: supabase.rpc('increment', { row_id: id }), // or handle client-side
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
}
```

Note: For `review_count` increment, the cleanest approach is to first read the current count, then write `count + 1`. Or use a Supabase RPC function. Choose whichever approach you prefer — both work for MVP.

---

### T5 — Shuffle cards

**Why:** Reviewing in the same order every time would make it too easy. Shuffle the deck at the start of each session.

**You do:** Add a shuffle utility function in `src/lib/utils.ts`:

```ts
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

This is the Fisher-Yates shuffle — a standard algorithm for randomising arrays.

---

## Acceptance Criteria

Phase 5 is complete when ALL of the following are true:

- [ ] Review page shows all user's lists with checkboxes
- [ ] "Start Review" is disabled when no list is selected
- [ ] After starting, flashcards appear one at a time
- [ ] Clicking the card flips it with an animation
- [ ] Back shows the meaning + pronunciation button
- [ ] "Good" and "Again" buttons advance to the next card
- [ ] After all cards → session complete screen
- [ ] review_count and last_reviewed_at are updated in Supabase
- [ ] Cards are in a different order each session (shuffled)

---

## Notes

- The flip animation is what makes this app feel polished. Spend time getting it right with smooth CSS transitions.
- "Again" cards could be added back to the end of the deck in a future version (basic spaced repetition). For now, just record the rating.
- This is a great feature to demo in interviews — it is visual, interactive, and clearly useful.

---

## Project Complete (MVP)

Congratulations — the full MVP flow is done:

1. Sign up / log in
2. Create a vocabulary list
3. Photograph or upload text
4. OCR → select words
5. Hear pronunciation, read/write meaning, save to list
6. Review with flashcards

**Next steps after MVP (optional, for portfolio enhancement):**
- Spaced repetition algorithm (SM-2 or similar)
- Export list to CSV
- Dark mode
- Offline mode with Service Workers
- Finnish/Spanish meaning API integration
- Deploy to Vercel with a custom domain
