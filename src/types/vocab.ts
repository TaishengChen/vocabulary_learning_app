export type Language = 'en' | 'fi' | 'es'

export interface VocabList {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface VocabItem {
  id: string
  user_id: string
  list_id: string
  text: string
  language: Language
  meaning: string
  source: string
  created_at: string
  updated_at: string
  review_count: number
  last_reviewed_at: string | null
}
