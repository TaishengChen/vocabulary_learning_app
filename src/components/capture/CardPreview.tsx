'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Language } from '@/types/vocab'
import type { VocabList } from '@/types/vocab'
import { createClient } from '@/lib/supabase/client'
import { getLists, createList } from '@/lib/db/vocabLists'
import { createItem } from '@/lib/db/vocabItems'
import { speak } from '@/lib/tts/speak'

interface Props {
  initialText: string
  language: Language
  onBack: () => void
}

export default function CardPreview({ initialText, language: initialLanguage, onBack }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [text, setText] = useState(initialText)
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [meaning, setMeaning] = useState('')
  const [lists, setLists] = useState<VocabList[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getLists(supabase).then((data) => {
      setLists(data)
      if (data.length > 0) setSelectedListId(data[0].id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateList() {
    if (!newListName.trim()) return
    const list = await createList(supabase, newListName.trim())
    setLists((prev) => [list, ...prev])
    setSelectedListId(list.id)
    setNewListName('')
    setShowNewList(false)
  }

  async function handleSave() {
    if (!text.trim() || !selectedListId) return
    setSaving(true)
    try {
      await createItem(supabase, {
        list_id: selectedListId,
        text: text.trim(),
        language,
        meaning,
      })
      router.push(`/book/${selectedListId}`)
    } catch (err) {
      console.error('Save error:', err)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <h2 className="text-lg font-semibold">New Card</h2>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Text</label>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => speak(text, language)}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-lg"
            title="Pronounce"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Text language</label>
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
        </div>
      </div>

      {/* Meaning */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">
          Meaning / translation
          <span className="text-gray-400 font-normal ml-1">(auto-fill coming in Phase 4)</span>
        </label>
        <textarea
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Write a meaning or translation..."
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-medium">Save to list</label>
        {lists.length > 0 && !showNewList && (
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {lists.map((list) => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
        )}

        {!showNewList ? (
          <button
            onClick={() => setShowNewList(true)}
            className="text-sm text-blue-600 hover:underline text-left"
          >
            + New list
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              placeholder="List name..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateList}
              className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewList(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !text.trim() || !selectedListId}
        className="bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Card'}
      </button>
    </div>
  )
}
