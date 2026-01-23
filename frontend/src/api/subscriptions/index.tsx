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