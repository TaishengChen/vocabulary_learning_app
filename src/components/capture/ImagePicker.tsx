'use client'

import { useRef } from 'react'

interface Props {
  onImageSelected: (file: File) => void
}

export default function ImagePicker({ onImageSelected }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImageSelected(file)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p className="text-gray-500 text-sm">Choose how to add an image</p>

      <div className="flex gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          📷 Take Photo
        </button>

        <button
          onClick={() => uploadRef.current?.click()}
          className="border border-gray-300 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Upload Image
        </button>
      </div>

      {/* Camera input — triggers native camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload input — opens file picker */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
