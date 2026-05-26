import Parser from "srt-parser-2"

// Not memoized: the same videoId can produce different SRT content when the
// user switches caption tracks between invocations.
export const convertSrtToText = async (_videoId: string, srt: string) => {
  const r = new Parser().fromSrt(srt)

  return r.map((item) => item.text).join("\n")
}
