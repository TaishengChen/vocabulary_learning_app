'use client'

interface Props {
  composedText: string
  onClear: () => void
  onCreateCard: () => void
}

export default function SelectionBar({ composedText, onClear, onCreateCard }: Props) {
  if (!composedText) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3 flex items-center gap-3">
      <p className="flex-1 text-sm font-medium text-gray-800 truncate">
        {composedText}
      </p>
      <button
        onClick={onClear}
        className="text-sm text-gray-400 hover:text-gray-600 shrink-0"
      >
        Clear
      </button>
      <button
        onClick={onCreateCard}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 shrink-0"
      >
        Create Card →
      </button>
    </div>
  )
}
