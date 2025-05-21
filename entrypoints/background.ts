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
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found")
        return
      }

      const activeTab = tabs[0]

      if (!activeTab.id) {
        console.error("Active tab has no ID")
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

        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
