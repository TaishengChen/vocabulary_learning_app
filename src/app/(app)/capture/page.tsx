'use client'

import { useState } from 'react'
import type { Language } from '@/types/vocab'
import type { OcrBox } from '@/lib/ocr/ocrTypes'
import { runOcr } from '@/lib/ocr/tesseractWorker'
import ImagePicker from '@/components/capture/ImagePicker'
import OcrOverlay from '@/components/capture/OcrOverlay'
import SelectionBar from '@/components/capture/SelectionBar'

type OcrState = 'idle' | 'loading' | 'done' | 'error'

function composeText(boxes: OcrBox[], selectedIds: string[]): string {
  return boxes
    .filter((b) => selectedIds.includes(b.id))
    .sort((a, b) =>
      a.bbox.y !== b.bbox.y ? a.bbox.y - b.bbox.y : a.bbox.x - b.bbox.x
    )
    .map((b) => b.text)
    .join(' ')
    .trim()
}

export default function CapturePage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [ocrState, setOcrState] = useState<OcrState>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [boxes, setBoxes] = useState<OcrBox[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function handleImageSelected(file: File) {
    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
    setBoxes([])
    setSelectedIds([])
    setOcrState('idle')
  }

  async function handleRunOcr() {
    if (!imageFile) return
    setOcrState('loading')
    setOcrProgress(0)
    try {
      const result = await runOcr(imageFile, language, setOcrProgress)
      setBoxes(result.boxes)
      setOcrState('done')
    } catch (err) {
      console.error('OCR error:', err)
      setOcrState('error')
    }
  }

  function handleToggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleClear() {
    setSelectedIds([])
  }

  function handleCreateCard() {
    const text = composeText(boxes, selectedIds)
    // Phase 3 will handle this — for now just log
    console.log('Create card:', { text, language })
    alert(`Card text: "${text}" (Phase 3 will open the card form)`)
  }

  const composedText = composeText(boxes, selectedIds)

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-4">Capture</h1>

      {!imageUrl ? (
        <ImagePicker onImageSelected={handleImageSelected} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Language selector */}
          <div className="flex gap-2">
            {(['en', 'fi', 'es'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  language === lang
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => {
                setImageUrl(null)
                setImageFile(null)
                setBoxes([])
                setSelectedIds([])
                setOcrState('idle')
              }}
              className="ml-auto text-sm text-gray-400 hover:text-gray-600"
            >
              ✕ Change image
            </button>
          </div>

          {/* OCR trigger */}
          {ocrState === 'idle' && (
            <button
              onClick={handleRunOcr}
              className="bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Run OCR
            </button>
          )}

          {/* Progress bar */}
          {ocrState === 'loading' && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500">Recognising text... {ocrProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {ocrState === 'error' && (
            <p className="text-red-500 text-sm">
              OCR failed. Try a clearer image with better lighting.
              <button onClick={handleRunOcr} className="ml-2 underline">Retry</button>
            </p>
          )}

          {/* Image with overlay */}
          {ocrState === 'done' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Tap words to select them. Selected: {selectedIds.length}
              </p>
              <OcrOverlay
                imageUrl={imageUrl}
                boxes={boxes}
                selectedIds={selectedIds}
                onToggle={handleToggle}
              />
            </div>
          )}

          {/* Show image while loading too */}
          {ocrState === 'loading' && (
            <img src={imageUrl} alt="preview" className="max-w-full max-h-[70vh] opacity-50" />
          )}
        </div>
      )}

      <SelectionBar
        composedText={composedText}
        onClear={handleClear}
        onCreateCard={handleCreateCard}
      />
    </div>
  )
}
