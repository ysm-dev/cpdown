import { useEffect, useState } from "react"
import { Settings, Copy, FileText, FileCode } from "lucide-react"
import { ToggleOption } from "@/components/ToggleOption"
import { getOptions, type OptionsState, saveOptions, type ExportFormat } from "@/lib/storage"
import { browser } from "wxt/browser"
import packageJson from "../../package.json"

export const App = () => {
  const [options, setOptions] = useState<OptionsState | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      const savedOptions = await getOptions()
      setOptions(savedOptions)
    }

    loadOptions()
  }, [])

  const handleOptionChange = async (
    key: keyof OptionsState,
    value: boolean | ExportFormat,
  ) => {
    if (!options) return

    let newOptions = { ...options, [key]: value }

    if (key === "useReadability" && value === true) {
      newOptions = { ...newOptions, useDeffudle: false }
    } else if (key === "useDeffudle" && value === true) {
      newOptions = { ...newOptions, useReadability: false }
    }

    setOptions(newOptions)
    await saveOptions(newOptions)
  }

  const openOptionsPage = () => {
    browser.runtime.openOptionsPage()
  }

  const copyCurrentPage = async () => {
    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!activeTab.id) {
        console.error("Active tab has no ID")
        return
      }

      const url = activeTab.url

      const restrictedProtocols = [
        "chrome:",
        "chrome-extension:",
        "moz-extension:",
        "edge-extension:",
        "about:",
        "data:",
        "javascript:",
        "chrome-search:",
        "chrome-devtools:",
      ]

      const restrictedUrls = [
        "chrome://newtab/",
        "edge://newtab/",
        "about:newtab",
        "about:blank",
      ]

      const isInjectable = (url?: string): boolean => {
        if (!url) return false
        if (restrictedProtocols.some((protocol) => url.startsWith(protocol))) {
          return false
        }
        if (restrictedUrls.some((restrictedUrl) => url.startsWith(restrictedUrl))) {
          return false
        }
        return true
      }

      if (!isInjectable(url)) {
        console.log("Cannot inject script into restricted URL:", url)
        return
      }

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

      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          return document.body.outerHTML
        },
      })

      if (results && results.length > 0 && results[0].result) {
        const bodyContent = results[0].result

        browser.tabs.sendMessage(activeTab.id!, {
          type: "COPY_TEXT",
          payload: bodyContent,
        })
      }
    } catch (error) {
      console.error("Error getting page content:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">cpdown</h1>
          <button
            onClick={openOptionsPage}
            className="rounded-md p-2 hover:bg-secondary transition-colors"
            title="Open Settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="space-y-4">
          <button
            onClick={copyCurrentPage}
            className="flex w-full items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Copy className="size-5" />
            <span className="font-medium">Copy Current Page</span>
          </button>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-medium text-sm">Export Format</h2>
            {options && (
              <div className="flex gap-2">
                <button
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    options.exportFormat === "markdown"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  onClick={() => handleOptionChange("exportFormat", "markdown")}
                >
                  <FileCode className="size-4" />
                  Markdown
                </button>
                <button
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    options.exportFormat === "txt"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  onClick={() => handleOptionChange("exportFormat", "txt")}
                >
                  <FileText className="size-4" />
                  TXT
                </button>
              </div>
            )}
          </div>

          {options && (
            <div className="space-y-1 rounded-lg border border-border bg-card p-4">
              <ToggleOption
                title="Wrap in triple backticks"
                description="Wrap the copied content in triple backticks"
                checked={options.wrapInTripleBackticks}
                onCheckedChange={(checked) =>
                  handleOptionChange("wrapInTripleBackticks", checked)
                }
              />

              <div className="border-border border-t"></div>

              <ToggleOption
                title="Show Success Toast"
                description="Display a notification when content is successfully copied"
                checked={options.showSuccessToast}
                onCheckedChange={(checked) =>
                  handleOptionChange("showSuccessToast", checked)
                }
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border p-4 text-center text-muted-foreground text-xs">
        <p>v{packageJson.version}</p>
      </footer>
    </div>
  )
}
