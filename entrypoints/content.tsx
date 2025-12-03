import { Readability } from "@mozilla/readability"
import Defuddle from "defuddle"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import { createRoot } from "react-dom/client"
import Turndown from "turndown"
import { browser } from "wxt/browser"
import { getRoot, Noti, showNotification } from "@/lib/showNotification"
import { getOptions } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { convertSrtToText } from "@/lib/yt/convertSrtToText"
import { getVideoInfo } from "@/lib/yt/getVideoInfo"
import {
  downloadSubtitle,
  getVideoSubtitlesList,
} from "@/lib/yt/getVideoSubtitle"
import { SubtitleSelector, type Track } from "@/components/SubtitleSelector"

const tiktoken = new Tiktoken(o200k_base)

// Utility to copy markdown to clipboard, respond to sender and optionally show toast/confetti
const copyAndNotify = async ({
  markdown,
  wrapInTripleBackticks,
  showSuccessToast,
  showConfetti,
  sendResponse,
  successMessagePrefix,
}: {
  markdown: string
  wrapInTripleBackticks: boolean
  showSuccessToast: boolean
  showConfetti: boolean
  sendResponse: (response: { success: boolean }) => void
  successMessagePrefix: string
}) => {
  if (wrapInTripleBackticks) {
    markdown = `\`\`\`md\n${markdown}\n\`\`\``
  }

  try {
    await navigator.clipboard.writeText(markdown)
  } catch (error) {
    // Fallback for when document is not focused (e.g., DevTools is open)
    const textarea = document.createElement("textarea")
    textarea.value = markdown
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  }

  sendResponse({ success: true })

  const tokens = tiktoken.encode(markdown)

  if (showSuccessToast) {
    showNotification(`${successMessagePrefix} (${tokens.length} tokens)`)
  }

  if (showConfetti) {
    // Send a message to the background script to open the Raycast confetti URL
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

        const subtitleData = await getVideoSubtitlesList(videoId)

        if (!subtitleData || !subtitleData.tracks || subtitleData.tracks.length === 0) {
          showNotification("No subtitle found", "error")
          return
        }

        const { tracks, pot } = subtitleData

        // Helper function to handle subtitle processing and notification
        const processSubtitle = async (track: Track) => {
          try {
            const subtitle = await downloadSubtitle(track.baseUrl, pot)

            if (!subtitle) {
              throw new Error("Failed to download subtitle")
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
            })
          } catch (error) {
             console.error("Error processing subtitle:", error)
             showNotification("Failed to process subtitle", "error")
          }
        }

        if (tracks.length === 1) {
          await processSubtitle(tracks[0])
        } else {
          // Render selection UI
          const root = getRoot()
          const container = document.createElement("div")
          // Ensure container is above everything
          container.style.position = "absolute"
          container.style.top = "0"
          container.style.left = "0"
          container.style.width = "100%"
          container.style.height = "0" // Don't block interaction with rest of page unless necessary?
          // Actually, the SubtitleSelector is fixed, so the container just needs to be in DOM

          root.appendChild(container)
          const reactRoot = createRoot(container)

          const handleSelect = async (track: Track) => {
            // Unmount first
            reactRoot.unmount()
            container.remove()

            await processSubtitle(track)
          }

          const handleClose = () => {
            reactRoot.unmount()
            container.remove()
          }

          reactRoot.render(
            <SubtitleSelector
              tracks={tracks}
              onSelect={handleSelect}
              onClose={handleClose}
            />
          )
        }

        return true
      }
    })
  },
})
