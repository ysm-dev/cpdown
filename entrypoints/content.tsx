import { Readability } from "@mozilla/readability"
import Defuddle from "defuddle"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import { createRoot } from "react-dom/client"
import Turndown from "turndown"
import { browser } from "wxt/browser"
import { getRoot, Noti, showNotification } from "@/lib/showNotification"
import { getOptions, type ExportFormat } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { convertSrtToText } from "@/lib/yt/convertSrtToText"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"
import { getVideoSubtitle } from "@/lib/yt/getVideoSubtitle"

const tiktoken = new Tiktoken(o200k_base)

// Utility to copy content to clipboard, respond to sender and optionally show toast/confetti
const copyAndNotify = async ({
  content,
  exportFormat,
  wrapInTripleBackticks,
  showSuccessToast,
  showConfetti,
  sendResponse,
  successMessagePrefix,
}: {
  content: string
  exportFormat: ExportFormat
  wrapInTripleBackticks: boolean
  showSuccessToast: boolean
  showConfetti: boolean
  sendResponse: (response: { success: boolean }) => void
  successMessagePrefix: string
}) => {
  let finalContent = content

  if (exportFormat === "markdown" && wrapInTripleBackticks) {
    finalContent = `\`\`\`md\n${finalContent}\n\`\`\``
  }

  try {
    await navigator.clipboard.writeText(finalContent)
  } catch (error) {
    // Fallback for when document is not focused (e.g., DevTools is open)
    const textarea = document.createElement("textarea")
    textarea.value = finalContent
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  }

  sendResponse({ success: true })

  const tokens = tiktoken.encode(finalContent)

  if (showSuccessToast) {
    showNotification(`${successMessagePrefix} (${tokens.length} tokens)`)
  }

  if (showConfetti) {
    // Send a message to the background script to open the Raycast confetti URL
    browser.runtime.sendMessage({ type: "OPEN_CONFETTI" })
  }
}

// Function to convert markdown to plain text
const markdownToTxt = (markdown: string): string => {
  let txt = markdown

  // Remove code blocks
  txt = txt.replace(/```[\s\S]*?```/g, "")

  // Remove inline code
  txt = txt.replace(/`[^`]+`/g, "")

  // Remove headers
  txt = txt.replace(/^#{1,6}\s+/gm, "")

  // Remove bold and italic
  txt = txt.replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
  txt = txt.replace(/\*\*([^*]+)\*\*/g, "$1")
  txt = txt.replace(/\*([^*]+)\*/g, "$1")
  txt = txt.replace(/___([^_]+)___/g, "$1")
  txt = txt.replace(/__([^_]+)__/g, "$1")
  txt = txt.replace(/_([^_]+)_/g, "$1")

  // Remove links but keep text
  txt = txt.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

  // Remove images
  txt = txt.replace(/!\[([^\]]*)\]\([^)]+\)/g, "")

  // Remove blockquotes
  txt = txt.replace(/^>\s+/gm, "")

  // Remove horizontal rules
  txt = txt.replace(/^-{3,}$/gm, "")
  txt = txt.replace(/^\*{3,}$/gm, "")
  txt = txt.replace(/^_{3,}$/gm, "")

  // Remove list markers
  txt = txt.replace(/^[-*+]\s+/gm, "")
  txt = txt.replace(/^\d+\.\s+/gm, "")

  // Remove extra newlines (more than 2)
  txt = txt.replace(/\n{3,}/g, "\n\n")

  // Trim whitespace
  txt = txt.trim()

  return txt
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
          exportFormat,
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

        let finalContent = markdown
        let successMessagePrefix = "Copied as markdown"

        if (exportFormat === "txt") {
          finalContent = markdownToTxt(markdown)
          successMessagePrefix = "Copied as text"
        }

        await copyAndNotify({
          content: finalContent,
          exportFormat,
          wrapInTripleBackticks,
          showSuccessToast,
          showConfetti,
          sendResponse,
          successMessagePrefix,
        })

        return true
      }

      if (msg.type === "COPY_YOUTUBE_SUBTITLE") {
        const options = await getOptions()

        const { showSuccessToast, showConfetti, wrapInTripleBackticks, exportFormat } =
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

        let finalContent = markdown
        let successMessagePrefix = "Subtitle copied as markdown"

        if (exportFormat === "txt") {
          finalContent = markdownToTxt(markdown)
          successMessagePrefix = "Subtitle copied as text"
        }

        await copyAndNotify({
          content: finalContent,
          exportFormat,
          wrapInTripleBackticks,
          showSuccessToast,
          showConfetti,
          sendResponse,
          successMessagePrefix,
        })

        return true
      }
    })
  },
})
