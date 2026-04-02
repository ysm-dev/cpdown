import { memoize } from "@fxts/core"
import { ofetch } from "ofetch"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"

interface CaptionTrack {
  baseUrl: string
  name: { simpleText: string }
  languageCode: string
}

export const getVideoSubtitle = memoize(async (videoId: string, languageCode?: string) => {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:11',message:'getVideoSubtitle called',data:{videoId,languageCode},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'ALL'})}).catch(()=>{});
  // #endregion
  
  const { r, pot } = await getVideoInfo(videoId)

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:17',message:'After getVideoInfo',data:{hasCaptions:!!r?.captions,hasRenderer:!!r?.captions?.playerCaptionsTracklistRenderer,pot,potType:typeof pot},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
  // #endregion

  const captionTracks = r.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:23',message:'Caption tracks extracted',data:{tracksLength:captionTracks.length,tracks:captionTracks.map((t:any)=>({lang:t.languageCode,hasUrl:!!t.baseUrl,name:t.name?.simpleText}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H5'})}).catch(()=>{});
  // #endregion
  
  if (captionTracks.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:28',message:'No caption tracks found - returning null',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return { srt: null, language: null, languageName: null }
  }

  // Try to find preferred language track
  let selectedTrack: CaptionTrack | undefined
  if (languageCode) {
    selectedTrack = captionTracks.find((track: CaptionTrack) => 
      track.languageCode.toLowerCase() === languageCode.toLowerCase()
    )
  }
  
  // Fall back to first available track if preferred not found
  if (!selectedTrack) {
    selectedTrack = captionTracks[0]
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:47',message:'Track selected',data:{hasTrack:!!selectedTrack,trackLang:selectedTrack?.languageCode,hasBaseUrl:!!selectedTrack?.baseUrl,baseUrl:selectedTrack?.baseUrl?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  
  if (!selectedTrack) {
    return { srt: null, language: null, languageName: null }
  }

  const url = selectedTrack.baseUrl
  if (!url) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:57',message:'No baseUrl - returning null',data:{track:selectedTrack},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    return { srt: null, language: null, languageName: null }
  }

  const { origin, pathname, searchParams } = new URL(url)

  searchParams.set("fmt", "srt")
  searchParams.set("c", "WEB")
  searchParams.set("pot", pot)

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:68',message:'About to fetch subtitle',data:{finalUrl:`${origin}${pathname}?${searchParams}`,pot},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H4'})}).catch(()=>{});
  // #endregion

  const srt = await ofetch<string>(`${origin}${pathname}?${searchParams}`, {
    parseResponse: (txt) => txt,
  })

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/24905037-5b6d-4676-b2b4-2bf91ff07501',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getVideoSubtitle.ts:76',message:'Subtitle fetched',data:{hasSrt:!!srt,srtLength:srt?.length,srtPreview:srt?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  return { 
    srt, 
    language: selectedTrack.languageCode,
    languageName: selectedTrack.name?.simpleText || selectedTrack.languageCode
  }
})
