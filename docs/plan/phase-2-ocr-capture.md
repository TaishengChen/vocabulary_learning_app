# Phase 2 — OCR & Capture

## Goal
Build the core capture flow: user opens the camera or selects an image, the app runs OCR in the browser, and the user can tap/select words from the detected text. By the end of this phase, selected text is displayed in a state variable — ready to be turned into a card in Phase 3.

## Prerequisites
- Phase 1 complete (auth, routes, DB schema)
- Supabase auth working

---

## Background: How OCR Works in This App

We use **Tesseract.js** — an OCR library that runs entirely in the browser using a Web Worker. This means:
- No image is ever sent to the server (privacy-friendly)
- The browser downloads language data (~5 MB per language) the first time
- OCR takes a few seconds — we must show a loading indicator

When OCR finishes, it returns a list of detected words with their positions on the image (called **bounding boxes**). We draw these boxes over the image as clickable areas.

---

## Tasks

### T1 — Install Tesseract.js

**You do:**
```bash
npm install tesseract.js
```

**Check:** Package appears in `package.json`.

---

### T2 — Create OCR types

**Why:** Shared types for OCR output keep the code consistent.

**You do:** Create `src/lib/ocr/ocrTypes.ts`:
```ts
export interface OcrBox {
  id: string
  text: string
  confidence: number
  bbox: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface OcrResult {
  language: 'en' | 'fi' | 'es'
  boxes: OcrBox[]
}
```

---

### T3 — Create the Tesseract worker helper

**Why:** We isolate all Tesseract.js logic in one place. This makes it easy to test and change later.

**You do:** Create `src/lib/ocr/tesseractWorker.ts`

The function should:
1. Accept: `imageFile: File`, `language: 'en' | 'fi' | 'es'`, `onProgress: (pct: number) => void`
2. Map language code to Tesseract language string: `en → eng`, `fi → fin`, `es → spa`
3. Create a Tesseract worker, load the language, run recognition
4. Parse the result into `OcrBox[]` — each word from `result.data.words`
5. Return an `OcrResult`
6. Terminate the worker after use

Key Tesseract fields per word:
- `word.text` → the detected text
- `word.confidence` → 0–100
- `word.bbox` → `{ x0, y0, x1, y1 }` → convert to `{ x: x0, y: y0, w: x1-x0, h: y1-y0 }`

Filter out words where `word.text.trim() === ''`.

---

### T4 — Create the ImagePicker component

**Why:** Users need two ways to get an image: take a photo with the camera, or upload from their gallery/files.

**You do:** Create `src/components/capture/ImagePicker.tsx`

The component should:
- Show a **"Take Photo"** button → opens native camera (use `<input type="file" accept="image/*" capture="environment">`)
- Show an **"Upload Image"** button → opens file picker (use `<input type="file" accept="image/*">`)
- On file selected → call `onImageSelected(file: File)` callback
- Show a preview of the selected image

On mobile browsers, the camera input triggers the native camera directly, like Google Translate does.

Props:
```ts
interface Props {
  onImageSelected: (file: File) => void
}
```

---

### T5 — Create the OCR overlay component

**Why:** After OCR, we need to show the image with clickable word boxes drawn on top.

**You do:** Create `src/components/capture/OcrOverlay.tsx`

The component should:
- Accept: `imageUrl: string`, `boxes: OcrBox[]`, `selectedIds: string[]`, `onToggle: (id: string) => void`
- Display the image
- For each box, draw a rectangle over the image at the correct position
  - **Unselected box:** semi-transparent border (e.g. blue border, no fill)
  - **Selected box:** highlighted background (e.g. blue fill at 40% opacity)
- Each box is clickable → calls `onToggle(box.id)`

**Important:** Bounding box coordinates from Tesseract are in original image pixels. The displayed image is scaled. You must scale the box positions using:
```
displayedWidth / originalImageWidth
```
Use a `<div>` with `position: relative` for the image container and `position: absolute` for each box.

---

### T6 — Create the SelectionBar component

**Why:** When boxes are selected, we show the composed text and a "Create Card" button.

**You do:** Create `src/components/capture/SelectionBar.tsx`

The component should:
- Show the composed text (joined selected boxes, sorted by position)
- Show a "Clear" button to deselect all
- Show a "Create Card →" button to proceed
- Be hidden when nothing is selected

Props:
```ts
interface Props {
  composedText: string
  onClear: () => void
  onCreateCard: () => void
}
```

---

### T7 — Build the capture page

**Why:** This page wires together all the components above into the full capture flow.

**You do:** Update `src/app/(app)/capture/page.tsx`

State the page needs to manage:
```ts
const [image, setImage] = useState<File | null>(null)
const [imageUrl, setImageUrl] = useState<string | null>(null)
const [language, setLanguage] = useState<Language>('en')
const [ocrState, setOcrState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
const [ocrProgress, setOcrProgress] = useState(0)
const [boxes, setBoxes] = useState<OcrBox[]>([])
const [selectedIds, setSelectedIds] = useState<string[]>([])
```

Flow:
1. Show `ImagePicker` — user picks an image
2. Show language selector (3 buttons: EN / FI / ES)
3. Show a "Run OCR" button
4. On click → call `runOcr()`:
   - Set state to `loading`
   - Call `tesseractWorker(image, language, setOcrProgress)`
   - On success → set boxes, state to `done`
   - On error → set state to `error`
5. Show OCR progress bar (0–100%) while loading
6. Show `OcrOverlay` when done
7. Show `SelectionBar` when any boxes are selected
8. "Create Card →" → save state and navigate to card preview (Phase 3)

Phrase composition logic:
```ts
function composeText(boxes: OcrBox[], selectedIds: string[]): string {
  return boxes
    .filter(b => selectedIds.includes(b.id))
    .sort((a, b) => a.bbox.y !== b.bbox.y ? a.bbox.y - b.bbox.y : a.bbox.x - b.bbox.x)
    .map(b => b.text)
    .join(' ')
    .trim()
}
```

---

## Acceptance Criteria

Phase 2 is complete when ALL of the following are true:

- [ ] Clicking "Take Photo" opens the device camera on mobile
- [ ] Clicking "Upload Image" opens the file picker
- [ ] After selecting an image, the language selector is visible
- [ ] Clicking "Run OCR" starts processing with a visible progress bar
- [ ] After OCR, word boxes are drawn over the image
- [ ] Clicking a box selects/deselects it (visual highlight)
- [ ] SelectionBar shows the composed text from selected boxes
- [ ] "Clear" removes all selections
- [ ] "Create Card →" is available when at least one box is selected

---

## Notes

- Tesseract.js is slower than a server-side OCR API. That is fine for this app. Show a clear loading state so the user is not confused.
- OCR accuracy depends on image quality. Add a hint: "Use images with clear text and good lighting for best results."
- The first OCR run downloads language data. Subsequent runs use the browser cache.

---

## Next Phase
[Phase 3 — Card Creation & Lists](./phase-3-card-lists.md)
