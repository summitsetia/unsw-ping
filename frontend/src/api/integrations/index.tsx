import { supabase } from "@/lib/supabase"

export const getGoogleCalendarIntegration = async (userId: string) => {
  const { data, error } = await supabase.from('google_calendar_tokens').select('*').eq('user_id', userId).single()
  if (error) {
    throw error
  }
  return data
}