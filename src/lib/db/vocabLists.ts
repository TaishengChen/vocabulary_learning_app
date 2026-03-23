import type { SupabaseClient } from '@supabase/supabase-js'
import type { VocabList } from '@/types/vocab'

export async function getLists(supabase: SupabaseClient): Promise<VocabList[]> {
  const { data, error } = await supabase
    .from('vocab_lists')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createList(supabase: SupabaseClient, name: string): Promise<VocabList> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('vocab_lists')
    .insert({ name, user_id: user!.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameList(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('vocab_lists')
    .update({ name })
    .eq('id', id)
  if (error) throw error
}

export async function deleteList(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('vocab_lists')
    .delete()
    .eq('id', id)
  if (error) throw error
}
