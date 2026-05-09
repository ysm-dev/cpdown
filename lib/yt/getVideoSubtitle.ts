import { memoize } from "@fxts/core"
import { ofetch } from "ofetch"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"

type CaptionTrackLike = {
  baseUrl?: string
  vssId?: string
  kind?: string
  languageCode?: string
}

const isManual = (t: CaptionTrackLike) => t.kind !== "asr"

// YouTube vssId convention:
//   ".{lang}"  = original manually authored caption (e.g. ".en")
//   "a.{lang}" = original auto-generated caption    (e.g. "a.en")
const isOriginalManual = (t: CaptionTrackLike) =>
  Boolean(t.vssId?.startsWith(".")) && isManual(t)
const isOriginalAsr = (t: CaptionTrackLike) =>
  Boolean(t.vssId?.startsWith("a."))

export const getVideoSubtitle = memoize(async (videoId: string) => {
  const { r, pot } = await getVideoInfo(videoId)

  const tracklist = r.captions?.playerCaptionsTracklistRenderer
  const captionTracks: CaptionTrackLike[] = tracklist?.captionTracks ?? []

  if (captionTracks.length === 0) {
    return null
  }

  // Pick the caption track that matches the main audio language.
  // Priority:
  //   1. Manual caption in default audio's language       (kind !== "asr")
  //   2. Auto-generated caption in default audio's lang   (kind === "asr")
  //   3. vssId-based fallback: original manual, then original asr
  //   4. captionTracks[0] as a last resort
  //
  // `captionTracks[0]` alone is unreliable: it's just whatever YouTube lists
  // first (often a translated track), so it can mismatch the voice.
  let captionTrack: CaptionTrackLike | undefined

  // Strategy 1: audioTracks -> captionTrackIndices (most reliable on modern API)
  const audioTracks = tracklist?.audioTracks
  const defaultAudioTrackIndex = tracklist?.defaultAudioTrackIndex
  const defaultAudioTrack =
    typeof defaultAudioTrackIndex === "number"
      ? audioTracks?.[defaultAudioTrackIndex]
      : undefined

  const audioCaptionIndices: number[] =
    defaultAudioTrack?.captionTrackIndices ?? []
  const audioCaptionCandidates = audioCaptionIndices
    .map((i: number) => captionTracks[i])
    .filter((t): t is CaptionTrackLike => Boolean(t))

  if (audioCaptionCandidates.length > 0) {
    captionTrack =
      audioCaptionCandidates.find(isManual) ?? audioCaptionCandidates[0]
  }

  // Strategy 2: vssId-based fallback when audioTracks data is unavailable.
  if (!captionTrack) {
    captionTrack =
      captionTracks.find(isOriginalManual) ??
      captionTracks.find(isOriginalAsr) ??
      captionTracks[0]
  }

  const url = captionTrack?.baseUrl

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
