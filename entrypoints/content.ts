import { getOptions } from "@/lib/storage"
import { defaultTagsToRemove } from "@/lib/tagsToRemove"
import { Readability } from "@mozilla/readability"
import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"
import Turndown from "turndown"
import { browser } from "wxt/browser"

const enc = new Tiktoken(o200k_base)

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

        const tokens = enc.encode(markdown)

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

function showNotification(message: string, isError = false) {
  // Create notification element
  const notification = document.createElement("div")
  notification.style.position = "fixed"
  notification.style.top = "20px"
  notification.style.right = "20px"
  notification.style.padding = "10px 20px"
  notification.style.borderRadius = "4px"
  notification.style.backgroundColor = isError ? "#f44336" : "#4CAF50"
  notification.style.color = "white"
  notification.style.zIndex = "10000"
  notification.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)"
  notification.textContent = message

  // Add to page
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.5s"

    setTimeout(() => {
      document.body.removeChild(notification)
    }, 500)
  }, 3000)
}
