import { ofetch } from "ofetch"
import { getSelectedCaption } from "@/lib/yt/getSelectedCaption"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"

type CaptionTrackLike = {
  baseUrl?: string
  vssId?: string
  kind?: string
  languageCode?: string
}

const isManual = (t: CaptionTrackLike) => t.kind !== "asr"
const isAsr = (t: CaptionTrackLike) =>
  t.kind === "asr" || Boolean(t.vssId?.startsWith("a."))

// YouTube vssId convention:
//   ".{lang}"  = original manually authored caption (e.g. ".en")
//   "a.{lang}" = original auto-generated caption    (e.g. "a.en")
const isOriginalManual = (t: CaptionTrackLike) =>
  Boolean(t.vssId?.startsWith(".")) && isManual(t)
const isOriginalAsr = (t: CaptionTrackLike) =>
  Boolean(t.vssId?.startsWith("a."))

// Not memoized: the user may switch caption tracks between invocations, so
// the returned SRT must reflect the current selection.
export const getVideoSubtitle = async (videoId: string) => {
  const [{ r, pot }, selected] = await Promise.all([
    getVideoInfo(videoId),
    getSelectedCaption(),
  ])

  const tracklist = r.captions?.playerCaptionsTracklistRenderer
  const captionTracks: CaptionTrackLike[] = tracklist?.captionTracks ?? []

  // Pick the caption track to fetch. Priority:
  //   0. The track the user currently has selected in the player.
  //   1. Manual caption in the default audio's language       (kind !== "asr")
  //   2. Auto-generated caption in the default audio's lang   (kind === "asr")
  //   3. vssId-based fallback: original manual, then original asr
  //   4. captionTracks[0] as a last resort
  let captionTrack: CaptionTrackLike | undefined

  // Strategy 0: honor the user's explicit selection in the YouTube player.
  // If the user is actively watching with, say, Korean captions selected, we
  // should copy Korean — even when Chinese (a creator-uploaded translation)
  // happens to be listed first in `captionTracks`.
  if (selected) {
    if (selected.vssId) {
      captionTrack = captionTracks.find((t) => t.vssId === selected.vssId)
    }
    if (!captionTrack && selected.languageCode) {
      captionTrack = captionTracks.find(
        (t) =>
          t.languageCode === selected.languageCode &&
          (t.kind ?? "") === (selected.kind ?? ""),
      )
    }
    // If the player is showing an auto-translated track (which won't appear in
    // `captionTracks`), use the selected baseUrl directly.
    if (!captionTrack && selected.baseUrl) {
      captionTrack = selected
    }
  }

  // Strategy 1: audioTracks -> captionTrackIndices (modern API).
  if (!captionTrack) {
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
      // The ASR caption is always in the audio's language. Use it to pin down
      // the audio language and filter out creator-uploaded translations that
      // YouTube may have lumped under the same audio.
      const asrInAudio = audioCaptionCandidates.find(isAsr)
      const audioLang = asrInAudio?.languageCode
      const sameLangCandidates = audioLang
        ? audioCaptionCandidates.filter((t) => t.languageCode === audioLang)
        : audioCaptionCandidates

      captionTrack =
        sameLangCandidates.find(isManual) ??
        sameLangCandidates[0] ??
        audioCaptionCandidates[0]
    }
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
}
