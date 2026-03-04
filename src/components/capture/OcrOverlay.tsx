'use client'

import { useRef, useEffect, useState } from 'react'
import type { OcrBox } from '@/lib/ocr/ocrTypes'

interface Props {
  imageUrl: string
  boxes: OcrBox[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export default function OcrOverlay({ imageUrl, boxes, selectedIds, onToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState({ x: 1, y: 1 })

  useEffect(() => {
    function updateScale() {
      const img = imgRef.current
      if (!img) return
      setScale({
        x: img.clientWidth / img.naturalWidth,
        y: img.clientHeight / img.naturalHeight,
      })
    }

    const img = imgRef.current
    if (!img) return
    img.addEventListener('load', updateScale)
    window.addEventListener('resize', updateScale)
    updateScale()

    return () => {
      img.removeEventListener('load', updateScale)
      window.removeEventListener('resize', updateScale)
    }
  }, [imageUrl])

  return (
    <div ref={containerRef} className="relative inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="OCR source"
        className="max-w-full max-h-[70vh] block"
      />

      {boxes.map((box) => {
        const isSelected = selectedIds.includes(box.id)
        return (
          <div
            key={box.id}
            onClick={() => onToggle(box.id)}
            style={{
              position: 'absolute',
              left: box.bbox.x * scale.x,
              top: box.bbox.y * scale.y,
              width: box.bbox.w * scale.x,
              height: box.bbox.h * scale.y,
              cursor: 'pointer',
            }}
            className={
              isSelected
                ? 'bg-blue-400/40 border-2 border-blue-500'
                : 'border-2 border-blue-300/60 hover:bg-blue-100/30'
            }
          />
        )
      })}
    </div>
  )
}
