'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLists, createList, renameList, deleteList } from '@/lib/db/vocabLists'
import type { VocabList } from '@/types/vocab'

export default function BookPage() {
  const supabase = createClient()

  const [lists, setLists] = useState<VocabList[]>([])
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getLists(supabase).then(setLists)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate() {
    if (!newListName.trim()) return
    const list = await createList(supabase, newListName.trim())
    setLists((prev) => [list, ...prev])
    setNewListName('')
    setShowNewList(false)
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return
    await renameList(supabase, id, renameValue.trim())
    setLists((prev) => prev.map((l) => l.id === id ? { ...l, name: renameValue.trim() } : l))
    setRenamingId(null)
  }

  async function handleDelete(id: string) {
    await deleteList(supabase, id)
    setLists((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Lists</h1>
        <button
          onClick={() => setShowNewList(true)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New List
        </button>
      </div>

      {/* New list input */}
      {showNewList && (
        <div className="flex gap-2 mb-4">
          <input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="List name..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
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

      {/* List of lists */}
      {lists.length === 0 && !showNewList && (
        <p className="text-gray-400 text-sm">No lists yet. Create one to get started.</p>
      )}

      <ul className="flex flex-col gap-2">
        {lists.map((list) => (
          <li key={list.id} className="border border-gray-200 rounded-xl px-4 py-3">
            {renamingId === list.id ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(list.id)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRename(list.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Save
                </button>
                <button
                  onClick={() => setRenamingId(null)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : deletingId === list.id ? (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-sm text-gray-700">
                  Delete <strong>{list.name}</strong>? This removes all its words.
                </p>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href={`/book/${list.id}`}
                  className="flex-1 text-sm font-medium text-gray-800 hover:text-blue-600"
                >
                  {list.name}
                </Link>
                <button
                  onClick={() => { setRenamingId(list.id); setRenameValue(list.name) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Rename
                </button>
                <button
                  onClick={() => setDeletingId(list.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
