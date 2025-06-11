import { browser } from "wxt/browser"

export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    copyCurrentPageAsMarkdown()
  })

  browser.commands.onCommand.addListener((command) => {
    if (command === "copy-as-markdown") {
      copyCurrentPageAsMarkdown()
    }
  })

  // Listen for messages from content scripts to open Raycast confetti without triggering page-level prompts
  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "OPEN_CONFETTI") {
      // Capture the currently active tab so focus can stay there
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(([currentTab]) => {
          // Open the confetti redirect tab in the background
          browser.tabs
            .create({ url: "https://raycast.com/confetti", active: false })
            .then((confettiTab) => {
              if (!confettiTab.id) return

              // Close the confetti tab automatically after a short delay
              setTimeout(() => {
                browser.tabs.remove(confettiTab.id!).catch(() => {
                  /* tab already closed */
                })
              }, 2000) // 2 초면 redirect 및 Raycast 실행 충분
            })
            .catch((err) => {
              console.error("Failed to open confetti tab:", err)
            })
        })
    }
  })

  async function copyCurrentPageAsMarkdown() {
    try {
      // Get the current active tab
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!activeTab.id) {
        console.error("Active tab has no ID")
        return
      }

      const url = activeTab.url

      const isYoutube = url?.includes("youtube.com")

      if (url && isYoutube) {
        const { searchParams } = new URL(url)

        const videoId = searchParams.get("v")

        if (!videoId) {
          throw new Error("No video ID found")
        }

        browser.tabs.sendMessage(activeTab.id!, {
          type: "COPY_YOUTUBE_SUBTITLE",
          payload: videoId,
        })

        return
      }

      // Execute a script in the tab to get the body content
      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          return document.body.outerHTML
        },
      })

      // The result is an array of execution results
      if (results && results.length > 0 && results[0].result) {
        const bodyContent = results[0].result
        console.log("Body content:", bodyContent)

        browser.tabs.query({ active: true, currentWindow: true }, () => {
          browser.tabs.sendMessage(activeTab.id!, {
            type: "COPY_TEXT",
            payload: bodyContent,
          })
        })
      }
    } catch (error) {
      console.error("Error getting page content:", error)
    }
  }
})
