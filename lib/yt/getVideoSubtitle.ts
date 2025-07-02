import { memoize } from "@fxts/core"
import { ofetch } from "ofetch"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"

export const getVideoSubtitle = memoize(async (videoId: string) => {
  const { r, pot } = await getVideoInfo(videoId)

  const url =
    r.captions.playerCaptionsTracklistRenderer.captionTracks.at(0)?.baseUrl

  if (!url) {
    return null
  }

  const { origin, pathname, searchParams } = new URL(url)

  searchParams.set("fmt", "srt")
  searchParams.set("c", "WEB")
  searchParams.set("pot", pot)

  const srt = await ofetch<string>(`${origin}${pathname}?${searchParams}`, {
    parseResponse: (txt) => txt,
  })

  return srt
})
