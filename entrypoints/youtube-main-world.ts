export default defineUnlistedScript(() => {
  // This script runs in the main world and can access window.ytInitialPlayerResponse

  // Variable to store the captured pot value
  let capturedPot = ""

  // Intercept XHR requests to capture pot parameter from timedtext API
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    // Check if this is a timedtext API request
    if (
      typeof url === "string" &&
      url.includes("https://www.youtube.com/api/timedtext")
    ) {
      try {
        const urlObj = new URL(url)
        const potParam = urlObj.searchParams.get("pot")
        if (potParam) {
          capturedPot = potParam
          console.log("Captured pot parameter:", potParam)
        }
      } catch (error) {
        console.error("Error parsing timedtext URL:", error)
      }
    }

    // Call the original open method
    return originalOpen.call(
      this,
      method,
      url,
      async ?? true,
      username,
      password,
    )
  }

  // Listen for messages from the content script
  window.addEventListener("message", async (event) => {
    if (event.source !== window) return

    if (event.data.type === "GET_YT_INITIAL_PLAYER_RESPONSE") {
      const ytInitialPlayerResponse = (window as any).ytInitialPlayerResponse

      const subtitleButton = document.querySelector<HTMLButtonElement>(
        "button.ytp-subtitles-button",
      )

      if (!capturedPot) {
        subtitleButton?.click?.()
        await new Promise((resolve) => setTimeout(resolve, 100))
        subtitleButton?.click?.()
      }

      // Send the response back to the content script with the captured pot value
      window.postMessage(
        {
          type: "YT_INITIAL_PLAYER_RESPONSE",
          data: {
            ytInitialPlayerResponse: ytInitialPlayerResponse || null,
            pot: capturedPot,
          },
          requestId: event.data.requestId,
        },
        "*",
      )
    }
  })

  console.log("YouTube main world script loaded")
})
