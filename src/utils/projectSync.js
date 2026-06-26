export const PROJECT_QUERY_KEY = 'project'

export function isCloudConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function getProjectIdFromUrl() {
  return new URLSearchParams(window.location.search).get(PROJECT_QUERY_KEY)
}

export function buildShareUrl(projectId) {
  const url = new URL(window.location.href)
  url.searchParams.set(PROJECT_QUERY_KEY, projectId)
  url.hash = '#/'
  return url.toString()
}

export function setProjectIdInUrl(projectId) {
  const url = new URL(window.location.href)
  url.searchParams.set(PROJECT_QUERY_KEY, projectId)
  window.history.replaceState({}, '', url.toString())
}

export function parseProjectIdFromInput(input) {
  const value = input.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    return url.searchParams.get(PROJECT_QUERY_KEY) || ''
  } catch {
    return value
  }
}
