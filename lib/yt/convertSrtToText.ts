import { memoize } from "@fxts/core"
import Parser from "srt-parser-2"

export const convertSrtToText = memoize(
  async (_videoId: string, srt: string) => {
    const r = new Parser().fromSrt(srt)

    return r.map((item) => item.text).join("\n")
  },
  (videoId) => videoId,
)
