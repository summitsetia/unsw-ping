import { supabase } from "@/lib/supabase"

export const getSubscriptions = async (userId: string) => {
  const { data, error } = await supabase.from('user_societies').select('society_name').eq('user_id', userId)
  if (error) {
    throw error
  }
  return data
}

export const removeSubscription = async (userId: string, societyName: string) => {
  const { error } = await supabase.from('user_societies').delete().eq('user_id', userId).eq('society_name', societyName)
  if (error) throw error
  return societyName
}

export const addSubscriptions = async (userId: string, societyNames: string[]) => {
  if (!societyNames.length) return []

  const rows = societyNames.map((society_name) => ({
    user_id: userId,
    society_name,
  }))

  const { error } = await supabase
    .from('user_societies')
    .upsert(rows, { onConflict: 'user_id,society_name', ignoreDuplicates: true })

  if (error) throw error
  return societyNames
}