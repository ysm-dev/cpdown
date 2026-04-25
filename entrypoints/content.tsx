import { Readability } from "@mozilla/readability"
import Defuddle from "defuddle"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import { createRoot } from "react-dom/client"
import Turndown from "turndown"
import { browser } from "wxt/browser"
import { getRoot, Noti, showNotification } from "@/lib/showNotification"
import { getOptions, addToHistory } from "@/lib/storage"
import { translateText, translateMarkdown } from "@/lib/translate"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { convertSrtToText } from "@/lib/yt/convertSrtToText"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"
import { getVideoSubtitle } from "@/lib/yt/getVideoSubtitle"

const tiktoken = new Tiktoken(o200k_base)

type ContentType = "webpage" | "subtitle" | "selection"

const copyAndNotify = async ({
  markdown,
  wrapInTripleBackticks,
  showSuccessToast,
  showConfetti,
  sendResponse,
  successMessagePrefix,
  contentType,
  title,
  url,
}: {
  markdown: string
  wrapInTripleBackticks: boolean
  showSuccessToast: boolean
  showConfetti: boolean
  sendResponse: (response: { success: boolean }) => void
  successMessagePrefix: string
  contentType: ContentType
  title?: string
  url?: string
}) => {
  const finalMarkdown = wrapInTripleBackticks
    ? `\`\`\`md\n${markdown}\n\`\`\``
    : markdown

  try {
    await navigator.clipboard.writeText(finalMarkdown)
  } catch (error) {
    const textarea = document.createElement("textarea")
    textarea.value = finalMarkdown
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  }

  const tokens = tiktoken.encode(finalMarkdown)
  const tokenCount = tokens.length

  try {
    await addToHistory({
      content: finalMarkdown,
      title: title || document.title || "Untitled",
      url: url || window.location.href,
      type: contentType,
      tokenCount,
    })
  } catch (error) {
    console.error("Failed to add to history:", error)
  }

  sendResponse({ success: true })

  if (showSuccessToast) {
    showNotification(`${successMessagePrefix} (${tokenCount} tokens)`)
  }

  if (showConfetti) {
    browser.runtime.sendMessage({ type: "OPEN_CONFETTI" })
  }
}

export default defineContentScript({
  matches: ["*://*/*"],
  async main() {
    createRoot(getRoot()).render(<Noti />)

    // Inject main world script for YouTube pages
    if (window.location.hostname.includes("youtube.com")) {
      try {
        await injectScript("/youtube-main-world.js", {
          keepInDom: true,
        })
        console.log("YouTube main world script injected")
      } catch (error) {
        console.error("Failed to inject YouTube main world script:", error)
      }
    }

    browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
      if (msg.type === "COPY_TEXT") {
        const options = await getOptions()

        const {
          useReadability,
          showSuccessToast,
          showConfetti,
          useDeffudle,
          wrapInTripleBackticks,
        } = options

        const html = msg.payload

        let markdown = html

        if (useReadability) {
          const doc = new DOMParser().parseFromString(html, "text/html")
          doc.getElementById("cpdown-notification")?.remove()

          const article = new Readability(doc).parse()

          if (!article?.content) {
            return sendResponse({ success: false, error: "No article found" })
          }

          markdown = new Turndown({})
            .remove(defaultTagsToRemove)
            .turndown(article.content)
        } else if (useDeffudle) {
          try {
            const doc = new DOMParser().parseFromString(html, "text/html")
            doc.getElementById("cpdown-notification")?.remove()
            const defuddle = new Defuddle(doc, {
              debug: true,
              markdown: true,
              separateMarkdown: false,
            }).parse()

            markdown = new Turndown({})
              .remove(defaultTagsToRemove)
              .turndown(defuddle.content)
          } catch (error) {
            console.error("Error processing with Defuddle:", error)
            // Fallback to basic Turndown if Defuddle fails
            markdown = new Turndown({})
              .remove(defaultTagsToRemove)
              .turndown(html)
            sendResponse({
              success: false,
              error: "Defuddle processing failed",
            })
            return // Prevent further execution in case of Defuddle error
          }
        } else {
          markdown = new Turndown({})
            //
            .remove(defaultTagsToRemove)
            .turndown(html)
        }

        await copyAndNotify({
          markdown,
          wrapInTripleBackticks,
          showSuccessToast,
          showConfetti,
          sendResponse,
          successMessagePrefix: "Copied as markdown",
          contentType: "webpage",
          title: document.title,
          url: window.location.href,
        })

        return true
      }

      if (msg.type === "COPY_YOUTUBE_SUBTITLE") {
        const options = await getOptions()

        const { showSuccessToast, showConfetti, wrapInTripleBackticks } =
          options

        const videoId = msg.payload

        const { r: videoInfo } = await getVideoInfo(videoId)

        const title =
          videoInfo?.videoDetails?.title ||
          document.querySelector("#title")?.textContent?.trim() ||
          "Untitle Video"

        const subtitle = await getVideoSubtitle(videoId)

        if (!subtitle) {
          throw new Error("No subtitle found")
        }

        let markdown = await convertSrtToText(videoId, subtitle)

        markdown = `# ${title}\n\n\n${markdown}`

        await copyAndNotify({
          markdown,
          wrapInTripleBackticks,
          showSuccessToast,
          showConfetti,
          sendResponse,
          successMessagePrefix: "Subtitle copied to clipboard",
          contentType: "subtitle",
          title,
          url: window.location.href,
        })

        return true
      }

      if (msg.type === "TRANSLATE_TEXT") {
        try {
          const { text, targetLanguage } = msg.payload
          const result = await translateText(text, targetLanguage)
          sendResponse(result)
        } catch (error) {
          console.error("Translation error:", error)
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Translation failed",
          })
        }
        return true
      }

      if (msg.type === "TRANSLATE_MARKDOWN") {
        try {
          const { markdown, targetLanguage } = msg.payload
          const result = await translateMarkdown(markdown, targetLanguage)
          sendResponse(result)
        } catch (error) {
          console.error("Markdown translation error:", error)
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Translation failed",
          })
        }
        return true
      }
    })
  },
})
