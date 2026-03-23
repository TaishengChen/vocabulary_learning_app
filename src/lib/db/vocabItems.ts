import type { SupabaseClient } from '@supabase/supabase-js'
import type { VocabItem } from '@/types/vocab'

export async function getItemsByList(supabase: SupabaseClient, listId: string): Promise<VocabItem[]> {
  const { data, error } = await supabase
    .from('vocab_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createItem(
  supabase: SupabaseClient,
  item: Pick<VocabItem, 'list_id' | 'text' | 'language' | 'meaning'>
): Promise<VocabItem> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('vocab_items')
    .insert({ ...item, user_id: user!.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItemMeaning(
  supabase: SupabaseClient,
  id: string,
  meaning: string
): Promise<void> {
  const { error } = await supabase
    .from('vocab_items')
    .update({ meaning })
    .eq('id', id)
  if (error) throw error
}

export async function deleteItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('vocab_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getItemsForReview(
  supabase: SupabaseClient,
  listIds: string[]
): Promise<VocabItem[]> {
  const { data, error } = await supabase
    .from('vocab_items')
    .select('*')
    .in('list_id', listIds)
    .order('last_reviewed_at', { ascending: true, nullsFirst: true })
  if (error) throw error
  return data ?? []
}

export async function updateReviewStats(
  supabase: SupabaseClient,
  id: string,
  currentCount: number
): Promise<void> {
  const { error } = await supabase
    .from('vocab_items')
    .update({
      review_count: currentCount + 1,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}
