'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLists } from '@/lib/db/vocabLists'
import { getItemsByList, updateItemMeaning, deleteItem } from '@/lib/db/vocabItems'
import type { VocabItem } from '@/types/vocab'

const langLabel: Record<string, string> = { en: 'EN', fi: 'FI', es: 'ES' }

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const supabase = createClient()

  const [listName, setListName] = useState('')
  const [items, setItems] = useState<VocabItem[]>([])
  const [search, setSearch] = useState('')
  const [editingMeaning, setEditingMeaning] = useState<Record<string, string>>({})

  useEffect(() => {
    getLists(supabase).then((lists) => {
      const found = lists.find((l) => l.id === listId)
      if (found) setListName(found.name)
    })
    getItemsByList(supabase, listId).then(setItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  async function handleMeaningBlur(id: string) {
    const meaning = editingMeaning[id]
    if (meaning === undefined) return
    await updateItemMeaning(supabase, id, meaning)
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, meaning } : item))
  }

  async function handleDelete(id: string) {
    await deleteItem(supabase, id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const filtered = items.filter((item) =>
    item.text.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/book" className="text-sm text-gray-400 hover:text-gray-600">
          ← My Lists
        </Link>
        <h1 className="text-xl font-bold">{listName || '...'}</h1>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search words..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtered.length === 0 && (
        <p className="text-gray-400 text-sm">
          {items.length === 0 ? 'No words yet. Go to Capture to add some.' : 'No matches.'}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((item) => (
          <li key={item.id} className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 flex-1">{item.text}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {langLabel[item.language] ?? item.language}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <textarea
              rows={2}
              value={editingMeaning[item.id] ?? item.meaning}
              onChange={(e) =>
                setEditingMeaning((prev) => ({ ...prev, [item.id]: e.target.value }))
              }
              onBlur={() => handleMeaningBlur(item.id)}
              placeholder="Write a meaning..."
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
