import { showNotification } from "@/lib/showNotification"
import { getOptions } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { Readability } from "@mozilla/readability"
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

        const { useReadability, showSuccessToast, showConfetti } = options

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
