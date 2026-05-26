export type SelectedCaption = {
  vssId?: string
  languageCode?: string
  kind?: string
  baseUrl?: string
}

// Reads the currently displayed caption track from the YouTube player via
// the main-world script. Returns `null` when no captions are shown.
//
// Not memoized: the user may switch tracks between invocations.
export const getSelectedCaption = (): Promise<SelectedCaption | null> => {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).substring(7)

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return

      if (
        event.data.type === "YT_CAPTIONS_SELECTION" &&
        event.data.requestId === requestId
      ) {
        window.removeEventListener("message", handleMessage)
        resolve(event.data.data ?? null)
      }
    }

    window.addEventListener("message", handleMessage)

    window.postMessage(
      {
        type: "GET_YT_CAPTIONS_SELECTION",
        requestId,
      },
      "*",
    )

    // Timeout to avoid hanging if the main-world script is unavailable.
    setTimeout(() => {
      window.removeEventListener("message", handleMessage)
      resolve(null)
    }, 1000)
  })
}
