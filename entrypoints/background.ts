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
