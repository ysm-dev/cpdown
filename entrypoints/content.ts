import { showNotification } from "@/lib/showNotification"
import { getOptions } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { Readability } from "@mozilla/readability"
import Defuddle from "defuddle"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import Turndown from "turndown"
import { browser } from "wxt/browser"

export default defineContentScript({
  matches: ["*://*/*"],
  main() {
    browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
      if (msg.type === "COPY_TEXT") {
        const options = await getOptions()

        const { useReadability, showSuccessToast, showConfetti, useDeffudle } =
          options

        const html = msg.payload

        let markdown = html

        if (useReadability) {
          const document = new DOMParser().parseFromString(html, "text/html")
          const article = new Readability(document).parse()

          if (!article?.content) {
            return sendResponse({ success: false, error: "No article found" })
          }

          markdown = new Turndown({})
            .remove(defaultTagsToRemove)
            .turndown(article.content)
        } else if (useDeffudle) {
          try {
            // Create a new DOM from the HTML string
            const doc = new DOMParser().parseFromString(html, "text/html")
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

        const tokens = new Tiktoken(o200k_base).encode(markdown)

        navigator.clipboard.writeText(markdown).then(
          () => sendResponse({ success: true }),
          (err) => sendResponse({ success: false, error: err.message }),
        )

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
