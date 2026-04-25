import { useEffect, useState } from "react"
import { ToggleOption } from "@/components/ToggleOption"
import { 
  getOptions, 
  type OptionsState, 
  saveOptions, 
  supportedLanguages,
  clearHistory
} from "@/lib/storage"
import { showNotification } from "@/lib/showNotification"
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
    value: boolean | string | number,
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

  const handleClearHistory = async () => {
    try {
      await clearHistory()
      showNotification("History cleared successfully", "success")
    } catch (error) {
      showNotification("Failed to clear history", "error")
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-background p-4 text-foreground">
      <header className="mb-4">
        <h1 className="font-bold text-xl">Settings</h1>
      </header>

      <div className="space-y-4">
        <div className="space-y-1 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Content Extraction
          </h2>
          
          {options && (
            <>
              <ToggleOption
                title="Use Deffudle"
                description="Process content using Deffudle for an alternative parsing method."
                checked={options.useDeffudle}
                onCheckedChange={(checked) =>
                  handleOptionChange("useDeffudle", checked)
                }
                infoLink="https://github.com/kepano/defuddle"
              />

              <div className="border-border border-t"></div>

              <ToggleOption
                title="Use Mozilla Readability"
                description="Parse webpage content using Readability for cleaner markdown output"
                checked={options.useReadability}
                onCheckedChange={(checked) =>
                  handleOptionChange("useReadability", checked)
                }
                infoLink="https://github.com/mozilla/readability"
              />

              <div className="border-border border-t"></div>

              <ToggleOption
                title="Wrap in triple backticks"
                description="Wrap the copied markdown in triple backticks"
                checked={options.wrapInTripleBackticks}
                onCheckedChange={(checked) =>
                  handleOptionChange("wrapInTripleBackticks", checked)
                }
              />
            </>
          )}
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Notifications
          </h2>
          
          {options && (
            <>
              <ToggleOption
                title="Show Success Toast"
                description="Display a notification when content is successfully copied"
                checked={options.showSuccessToast}
                onCheckedChange={(checked) =>
                  handleOptionChange("showSuccessToast", checked)
                }
              />

              <div className="border-border border-t"></div>

              <ToggleOption
                title="Show Raycast Confetti"
                description="Celebrate successful copying with a confetti animation."
                checked={options.showConfetti}
                onCheckedChange={(checked) =>
                  handleOptionChange("showConfetti", checked)
                }
                infoLink="https://x.com/raycastapp/status/1691464764516343808"
              />
            </>
          )}
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Translation
          </h2>
          
          {options && (
            <>
              <ToggleOption
                title="Enable Translation"
                description="Enable text translation features in the sidebar panel."
                checked={options.enableTranslation}
                onCheckedChange={(checked) =>
                  handleOptionChange("enableTranslation", checked)
                }
              />

              {options.enableTranslation && (
                <>
                  <div className="border-border border-t my-3"></div>
                  
                  <div className="flex items-start justify-between gap-4 py-3">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">Default Target Language</h3>
                      <p className="text-muted-foreground text-xs">
                        Choose the default language for translations.
                      </p>
                    </div>
                    <select
                      value={options.targetLanguage}
                      onChange={(e) =>
                        handleOptionChange("targetLanguage", e.target.value)
                      }
                      className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            History
          </h2>
          
          {options && (
            <>
              <ToggleOption
                title="Enable History"
                description="Save copied content to local history for later access."
                checked={options.enableHistory}
                onCheckedChange={(checked) =>
                  handleOptionChange("enableHistory", checked)
                }
              />

              {options.enableHistory && (
                <>
                  <div className="border-border border-t my-3"></div>
                  
                  <div className="flex items-start justify-between gap-4 py-3">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">Maximum History Items</h3>
                      <p className="text-muted-foreground text-xs">
                        Maximum number of items to keep in history.
                      </p>
                    </div>
                    <select
                      value={options.maxHistoryItems}
                      onChange={(e) =>
                        handleOptionChange("maxHistoryItems", Number(e.target.value))
                      }
                      className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value={50}>50 items</option>
                      <option value={100}>100 items</option>
                      <option value={200}>200 items</option>
                      <option value={500}>500 items</option>
                    </select>
                  </div>

                  <div className="border-border border-t my-3"></div>
                  
                  <div className="flex items-start justify-between gap-4 py-3">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">Clear History</h3>
                      <p className="text-muted-foreground text-xs">
                        Remove all items from your copy history.
                      </p>
                    </div>
                    <button
                      onClick={handleClearHistory}
                      className="mt-1 rounded-md bg-destructive px-3 py-2 text-destructive-foreground text-sm hover:bg-destructive/90"
                    >
                      Clear All
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="mt-6 text-center text-muted-foreground text-xs">
        <p>
          cpdown v{packageJson.version} — Copy any webpage as clean markdown
        </p>
      </footer>
    </div>
  )
}
