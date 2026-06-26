import { createClient } from '@supabase/supabase-js'
import { isCloudConfigured } from './projectSync'

let client = null

export function getSupabase() {
  if (!isCloudConfigured()) return null
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  }
  return client
}

export async function fetchProjectData(projectId) {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('decoration_projects')
    .select('data')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return data?.data || null
}

export async function upsertProjectData(projectId, payload) {
  const supabase = getSupabase()
  if (!supabase) return

  const { error } = await supabase.from('decoration_projects').upsert({
    id: projectId,
    data: payload,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}
