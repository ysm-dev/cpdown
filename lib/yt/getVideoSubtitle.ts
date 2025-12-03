import { memoize } from "@fxts/core"
import { ofetch } from "ofetch"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"

// New function to download subtitle content
export const downloadSubtitle = async (
  baseUrl: string,
  pot?: string,
): Promise<string | null> => {
  if (!baseUrl) {
    return null
  }

  const { origin, pathname, searchParams } = new URL(baseUrl)

  searchParams.set("fmt", "srt")
  searchParams.set("c", "WEB")
  if (pot) {
    searchParams.set("pot", pot)
  }

  const srt = await ofetch<string>(`${origin}${pathname}?${searchParams}`, {
    parseResponse: (txt) => txt,
  })

  return srt
}

// Renamed and refactored to return the list of tracks and pot, or null
export const getVideoSubtitlesList = memoize(async (videoId: string) => {
  const { r, pot } = await getVideoInfo(videoId)

  const tracks = r.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!tracks || tracks.length === 0) {
    return null
  }

  return { tracks, pot }
})

// Kept for backward compatibility if needed, but we will move away from it
export const getVideoSubtitle = memoize(async (videoId: string) => {
  const result = await getVideoSubtitlesList(videoId)

  if (!result) return null

  const { tracks, pot } = result
  const firstTrack = tracks.at(0)

  if (!firstTrack?.baseUrl) {
    return null
  }

  return downloadSubtitle(firstTrack.baseUrl, pot)
})
