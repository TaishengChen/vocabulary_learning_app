# Phase 4 — Meaning Providers

## Goal
Implement the meaning fetch system. For English words, automatically fetch a definition from a free dictionary API. For Finnish and Spanish, leave the field empty for the user to fill in. Use a clean provider pattern that makes it easy to add more APIs later.

## Prerequisites
- Phase 3 complete (CardPreview exists and has a meaning field)

---

## Background: Why a Provider Pattern?

Instead of writing `if (lang === 'en') fetch(...)` directly in the component, we define a `MeaningProvider` interface and create separate classes for each language. The `MeaningManager` picks the right provider automatically.

This is good engineering because:
- Easy to add a Finnish translation API later without touching the rest of the code
- Easy to unit test each provider independently
- The component only calls `meaningManager.getMeaning(text, lang)` — it does not know which API is used

---

## Tasks

### T1 — Define the MeaningProvider interface

**You do:** Create `src/lib/meaning/providers.ts`:

```ts
export interface MeaningProvider {
  canHandle(lang: string): boolean
  getMeaning(text: string, lang: string): Promise<{ meaning: string; source: string }>
}
```

---

### T2 — Implement EnglishDictionaryProvider

**You do:** Add to `src/lib/meaning/providers.ts`:

API used: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` (free, no key needed)

Logic:
1. `canHandle(lang)` → returns `lang === 'en'`
2. `getMeaning(text, lang)`:
   - Fetch from dictionaryapi.dev
   - If response is not ok → throw error
   - Parse: take the first entry → first meaning → first definition
   - Return `{ meaning: firstDefinition, source: 'dictionaryapi.dev' }`
   - If parsing fails for any reason → throw error

Example response path:
```
response[0].meanings[0].definitions[0].definition
```

---

### T3 — Implement FiEsFallbackProvider

**You do:** Add to `src/lib/meaning/providers.ts`:

Logic:
1. `canHandle(lang)` → returns `lang === 'fi' || lang === 'es'`
2. `getMeaning(text, lang)` → returns `{ meaning: '', source: 'manual' }` immediately (no API call)

This is intentionally simple for MVP. The user types the meaning themselves.

---

### T4 — Implement MeaningManager

**You do:** Create `src/lib/meaning/meaningManager.ts`:

```ts
export class MeaningManager {
  private providers: MeaningProvider[]

  constructor(providers: MeaningProvider[]) {
    this.providers = providers
  }

  async getMeaning(text: string, lang: string): Promise<{ meaning: string; source: string }> {
    const provider = this.providers.find(p => p.canHandle(lang))
    if (!provider) return { meaning: '', source: 'manual' }

    try {
      return await provider.getMeaning(text, lang)
    } catch {
      return { meaning: '', source: 'manual' }
    }
  }
}
```

Create a default instance to use across the app:
```ts
export const meaningManager = new MeaningManager([
  new EnglishDictionaryProvider(),
  new FiEsFallbackProvider(),
])
```

---

### T5 — Integrate into CardPreview

**Why:** Now that the meaning system is built, wire it into the CardPreview component.

**You do:** Update `src/components/capture/CardPreview.tsx`

When the component mounts (or when text/language changes):
1. Set meaning state to `loading`
2. Call `meaningManager.getMeaning(text, language)`
3. Set meaning state to the returned value
4. If source is `'manual'` → show "No definition found. Write your own meaning."

The meaning text area should always be editable regardless of whether a definition was auto-fetched.

---

### T6 — Write unit tests for MeaningManager

**Why:** This is one of the most important parts to test. It has clear inputs and outputs, making it perfect for unit tests.

**You do:** Create `src/lib/meaning/meaningManager.test.ts`

Tests to write:
1. English text → calls EnglishDictionaryProvider → returns meaning
2. Finnish text → calls FiEsFallbackProvider → returns empty meaning
3. Spanish text → calls FiEsFallbackProvider → returns empty meaning
4. If EnglishDictionaryProvider throws → MeaningManager returns `{ meaning: '', source: 'manual' }`
5. Unknown language → returns `{ meaning: '', source: 'manual' }`

Use Jest (already included in Next.js). Mock the actual API fetch calls.

Run tests with:
```bash
npm test
```

---

## Acceptance Criteria

Phase 4 is complete when ALL of the following are true:

- [ ] Selecting an English word in capture → definition appears automatically in CardPreview
- [ ] Selecting a Finnish/Spanish word → meaning field is empty, user can type
- [ ] If the English API fails → meaning field is empty, no crash
- [ ] Meaning is always editable
- [ ] All unit tests pass

---

## Notes

- dictionaryapi.dev only works for single English words, not multi-word phrases. If the user selects a phrase, the API may return 404. Handle this gracefully — show empty meaning and let the user write their own.
- The `FiEsFallbackProvider` is clearly labelled "manual" so interviewers can see you designed it to be extended later. This is a good talking point in interviews.

---

## Next Phase
[Phase 5 — Flashcards](./phase-5-flashcards.md)
