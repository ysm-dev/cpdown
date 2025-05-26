import { Noti, getRoot, showNotification } from "@/lib/showNotification"
import { getOptions } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { Readability } from "@mozilla/readability"
import Defuddle from "defuddle"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import { createRoot } from "react-dom/client"
import Turndown from "turndown"
import { browser } from "wxt/browser"

const tiktoken = new Tiktoken(o200k_base)

export default defineContentScript({
  matches: ["*://*/*"],
  main() {
    createRoot(getRoot()).render(<Noti />)

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

        if (wrapInTripleBackticks) {
          markdown = `\`\`\`md\n${markdown}\n\`\`\``
        }

        const tokens = tiktoken.encode(markdown)

        await navigator.clipboard.writeText(markdown)

        sendResponse({ success: true })

        if (showSuccessToast) {
          showNotification(`Copied as markdown (${tokens.length} tokens)`)
        }

        if (showConfetti) {
          location.href = `raycast://confetti`
        }

        return true
      }
    })
  },
})
