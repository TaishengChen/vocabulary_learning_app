'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          <Link href="/capture" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Capture
          </Link>
          <Link href="/book" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            My Lists
          </Link>
          <Link href="/review" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Review
          </Link>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Sign out
        </button>
      </nav>
      <main className="p-4">
        {children}
      </main>
    </div>
  )
}
