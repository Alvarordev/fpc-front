export type TalkFilters = {
  search: string
  talk: string | null
}

export function readTalkFilters(params: URLSearchParams): TalkFilters {
  return {
    search: params.get("q") ?? "",
    talk: params.get("charla"),
  }
}

export function writeTalkFilters(params: URLSearchParams, filters: TalkFilters) {
  const next = new URLSearchParams(params)
  if (filters.search.trim()) next.set("q", filters.search.trim())
  else next.delete("q")
  if (filters.talk) next.set("charla", filters.talk)
  else next.delete("charla")
  return next
}

export function talkFiltersNarrow(filters: TalkFilters) {
  return Boolean(filters.search.trim() || filters.talk)
}
