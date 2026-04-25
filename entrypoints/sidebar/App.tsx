import { useEffect, useState, useCallback } from "react"
import { Toaster, toast } from "sonner"
import { 
  Copy, 
  History, 
  Languages, 
  Settings, 
  Trash2, 
  Check, 
  X, 
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
  Subtitles,
  RefreshCw,
  ClipboardList,
  ExternalLink
} from "lucide-react"
import { browser } from "wxt/browser"
import { 
  getOptions, 
  saveOptions, 
  getHistory, 
  removeFromHistory, 
  removeMultipleFromHistory, 
  clearHistory,
  type HistoryItem,
  type OptionsState,
  supportedLanguages
} from "@/lib/storage"
import { translateText, translateMarkdown } from "@/lib/translate"

type Tab = "actions" | "history" | "translate" | "settings"

export const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>("actions")
  const [options, setOptions] = useState<OptionsState | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<Set<string>>(new Set())
  const [translateTextInput, setTranslateTextInput] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedOptions, savedHistory] = await Promise.all([
          getOptions(),
          getHistory(),
        ])
        setOptions(savedOptions)
        setHistory(savedHistory)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const copyToClipboard = useCallback(async (text: string, successMessage: string = "Copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch (error) {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      toast.success(successMessage)
    }
  }, [])

  const handleOptionChange = useCallback(async (
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
    toast.success("Settings saved")
  }, [options])

  const handleCopyCurrentPage = useCallback(async () => {
    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!activeTab.id) {
        toast.error("Could not identify the current tab")
        return
      }

      const url = activeTab.url

      const restrictedProtocols = [
        "chrome:", "chrome-extension:", "moz-extension:", 
        "edge-extension:", "about:", "data:", "javascript:",
        "chrome-search:", "chrome-devtools:"
      ]
      const restrictedUrls = ["chrome://newtab/", "edge://newtab/", "about:newtab", "about:blank"]

      if (!url || 
          restrictedProtocols.some(p => url.startsWith(p)) ||
          restrictedUrls.some(u => url.startsWith(u))) {
        toast.warning("Cannot copy content from this page")
        return
      }

      const isYoutube = url.includes("youtube.com")

      if (isYoutube) {
        const { searchParams } = new URL(url)
        const videoId = searchParams.get("v")

        if (!videoId) {
          toast.error("No video ID found")
          return
        }

        browser.tabs.sendMessage(activeTab.id, {
          type: "COPY_YOUTUBE_SUBTITLE",
          payload: videoId,
        })
        toast.info("Copying YouTube subtitle...")
        return
      }

      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.body.outerHTML,
      })

      if (results && results.length > 0 && results[0].result) {
        browser.tabs.sendMessage(activeTab.id, {
          type: "COPY_TEXT",
          payload: results[0].result,
        })
        toast.info("Copying page content...")
      }
    } catch (error) {
      console.error("Error copying page:", error)
      toast.error("Failed to copy page content")
    }
  }, [])

  const handleCopySelection = useCallback(async () => {
    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!activeTab.id) {
        toast.error("Could not identify the current tab")
        return
      }

      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => window.getSelection()?.toString() || "",
      })

      if (results && results.length > 0 && results[0].result) {
        const selectedText = results[0].result as string
        if (selectedText.trim()) {
          await copyToClipboard(selectedText, "Selection copied to clipboard")
        } else {
          toast.warning("No text selected")
        }
      }
    } catch (error) {
      console.error("Error copying selection:", error)
      toast.error("Failed to copy selection")
    }
  }, [copyToClipboard])

  const handleTranslate = useCallback(async () => {
    if (!translateTextInput.trim() || !options) return

    setIsTranslating(true)
    setTranslatedText("")

    try {
      const result = await translateMarkdown(
        translateTextInput,
        options.targetLanguage
      )

      if (result.success && result.translatedText) {
        setTranslatedText(result.translatedText)
      } else {
        toast.error(result.error || "Translation failed")
      }
    } catch (error) {
      console.error("Translation error:", error)
      toast.error("Translation failed")
    } finally {
      setIsTranslating(false)
    }
  }, [translateTextInput, options])

  const toggleHistoryItemSelection = useCallback((id: string) => {
    setSelectedHistoryItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAllHistory = useCallback(() => {
    if (selectedHistoryItems.size === history.length) {
      setSelectedHistoryItems(new Set())
    } else {
      setSelectedHistoryItems(new Set(history.map(item => item.id)))
    }
  }, [history, selectedHistoryItems.size])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedHistoryItems.size === 0) return

    try {
      await removeMultipleFromHistory(Array.from(selectedHistoryItems))
      setHistory(prev => prev.filter(item => !selectedHistoryItems.has(item.id)))
      setSelectedHistoryItems(new Set())
      toast.success(`Deleted ${selectedHistoryItems.size} items`)
    } catch (error) {
      console.error("Error deleting history items:", error)
      toast.error("Failed to delete items")
    }
  }, [selectedHistoryItems])

  const handleClearHistory = useCallback(async () => {
    try {
      await clearHistory()
      setHistory([])
      setSelectedHistoryItems(new Set())
      toast.success("History cleared")
    } catch (error) {
      console.error("Error clearing history:", error)
      toast.error("Failed to clear history")
    }
  }, [])

  const handleDeleteHistoryItem = useCallback(async (id: string) => {
    try {
      await removeFromHistory(id)
      setHistory(prev => prev.filter(item => item.id !== id))
      setSelectedHistoryItems(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success("Item deleted")
    } catch (error) {
      console.error("Error deleting history item:", error)
      toast.error("Failed to delete item")
    }
  }, [])

  const refreshHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const savedHistory = await getHistory()
      setHistory(savedHistory)
    } catch (error) {
      console.error("Error refreshing history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "webpage":
        return <Globe className="size-4" />
      case "subtitle":
        return <Subtitles className="size-4" />
      case "selection":
        return <FileText className="size-4" />
      default:
        return <FileText className="size-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "webpage":
        return "Webpage"
      case "subtitle":
        return "Subtitle"
      case "selection":
        return "Selection"
      default:
        return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="animate-spin rounded-full border-2 border-primary border-t-transparent size-8"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toaster position="top-right" richColors closeButton />
      
      <header className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Copy className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">cpdown</h1>
            <p className="text-muted-foreground text-xs">Copy & Translate</p>
          </div>
        </div>
      </header>

      <nav className="flex border-b border-border bg-card">
        {[
          { id: "actions" as Tab, icon: Copy, label: "Actions" },
          { id: "history" as Tab, icon: History, label: "History" },
          { id: "translate" as Tab, icon: Languages, label: "Translate" },
          { id: "settings" as Tab, icon: Settings, label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 px-2 text-xs transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {activeTab === "actions" && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </h2>
              
              <button
                onClick={handleCopyCurrentPage}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Copy Current Page</h3>
                  <p className="text-muted-foreground text-xs">Copy page content as clean markdown</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground" />
              </button>

              <button
                onClick={handleCopySelection}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/50">
                  <ClipboardList className="size-5 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Copy Selection</h3>
                  <p className="text-muted-foreground text-xs">Copy selected text from the page</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground" />
              </button>
            </div>

            {options && options.enableTranslation && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Translation
                </h2>
                
                <button
                  onClick={() => setActiveTab("translate")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Languages className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Open Translator</h3>
                    <p className="text-muted-foreground text-xs">
                      Translate text to {supportedLanguages.find(l => l.code === options.targetLanguage)?.name || "target language"}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {options && options.enableHistory && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Recent
                </h2>
                
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          copyToClipboard(item.content, "Copied from history")
                        }}
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <p className="text-muted-foreground text-xs truncate">
                            {formatDate(item.timestamp)} · {item.tokenCount} tokens
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    {history.length > 3 && (
                      <button
                        onClick={() => setActiveTab("history")}
                        className="w-full py-2 text-primary text-sm hover:underline"
                      >
                        View all {history.length} items →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <History className="mx-auto size-10 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground text-sm">No history yet</p>
                    <p className="text-muted-foreground text-xs">Copied content will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Copy History</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshHistory}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                  title="Refresh"
                >
                  <RefreshCw className="size-4" />
                </button>
                
                {selectedHistoryItems.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-destructive-foreground text-sm"
                  >
                    <Trash2 className="size-3" />
                    Delete ({selectedHistoryItems.size})
                  </button>
                )}
                
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 rounded-md px-3 py-1.5 text-muted-foreground text-sm hover:bg-accent"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedHistoryItems.size === history.length && history.length > 0}
                    onChange={selectAllHistory}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Select all</span>
                </label>
                <span className="text-muted-foreground text-sm">{history.length} items</span>
              </div>
            )}

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border transition-colors ${
                      selectedHistoryItems.has(item.id)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={selectedHistoryItems.has(item.id)}
                        onChange={() => toggleHistoryItemSelection(item.id)}
                        className="mt-1 rounded border-input"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              {getTypeIcon(item.type)}
                              {getTypeLabel(item.type)}
                            </span>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-muted-foreground text-xs truncate">
                              {formatDate(item.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-muted-foreground text-xs">
                              {item.tokenCount} tokens
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="mt-1 font-medium text-sm truncate">{item.title}</h3>
                        
                        {expandedHistoryItem === item.id ? (
                          <div className="mt-2">
                            <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                              {item.content}
                            </pre>
                          </div>
                        ) : (
                          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                            {item.content.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border px-3 py-2">
                      <button
                        onClick={() => setExpandedHistoryItem(
                          expandedHistoryItem === item.id ? null : item.id
                        )}
                        className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                      >
                        {expandedHistoryItem === item.id ? (
                          <><ChevronUp className="size-3" /> Collapse</>
                        ) : (
                          <><ChevronDown className="size-3" /> Expand</>
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(item.content, "Copied from history")}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-primary text-xs hover:bg-primary/10"
                        >
                          <Copy className="size-3" />
                          Copy
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-destructive text-xs hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="size-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium">No history yet</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Copied content will be saved here automatically
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "translate" && (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold">Text Translator</h2>
            
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Target Language</label>
                <select
                  value={options?.targetLanguage || "zh-CN"}
                  onChange={(e) => handleOptionChange("targetLanguage", e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Source Text</label>
                <textarea
                  value={translateTextInput}
                  onChange={(e) => setTranslateTextInput(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="min-h-32 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <button
                onClick={handleTranslate}
                disabled={!translateTextInput.trim() || isTranslating}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                {isTranslating ? (
                  <><RefreshCw className="size-4 animate-spin" /> Translating...</>
                ) : (
                  <><Languages className="size-4" /> Translate</>
                )}
              </button>
            </div>
            
            {translatedText && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Translated Text</label>
                  <button
                    onClick={() => copyToClipboard(translatedText, "Translation copied")}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-primary text-xs hover:bg-primary/10"
                  >
                    <Copy className="size-3" />
                    Copy
                  </button>
                </div>
                <div className="min-h-32 rounded-md border border-border bg-card p-3">
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {translatedText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && options && (
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <h2 className="font-semibold">Content Extraction</h2>
              
              <div className="space-y-1 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Use Defuddle</h3>
                    <p className="text-muted-foreground text-xs">
                      Process content using Defuddle for an alternative parsing method.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.useDeffudle}
                    onChange={(e) => handleOptionChange("useDeffudle", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
                
                <div className="border-border border-t my-3"></div>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Use Mozilla Readability</h3>
                    <p className="text-muted-foreground text-xs">
                      Parse webpage content using Readability for cleaner markdown output.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.useReadability}
                    onChange={(e) => handleOptionChange("useReadability", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
                
                <div className="border-border border-t my-3"></div>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Wrap in Triple Backticks</h3>
                    <p className="text-muted-foreground text-xs">
                      Wrap the copied markdown in triple backticks.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.wrapInTripleBackticks}
                    onChange={(e) => handleOptionChange("wrapInTripleBackticks", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-semibold">Notifications</h2>
              
              <div className="space-y-1 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Show Success Toast</h3>
                    <p className="text-muted-foreground text-xs">
                      Display a notification when content is successfully copied.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showSuccessToast}
                    onChange={(e) => handleOptionChange("showSuccessToast", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
                
                <div className="border-border border-t my-3"></div>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Show Raycast Confetti</h3>
                    <p className="text-muted-foreground text-xs">
                      Celebrate successful copying with a confetti animation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.showConfetti}
                    onChange={(e) => handleOptionChange("showConfetti", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-semibold">Translation</h2>
              
              <div className="space-y-1 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Enable Translation</h3>
                    <p className="text-muted-foreground text-xs">
                      Enable text translation features in the sidebar.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.enableTranslation}
                    onChange={(e) => handleOptionChange("enableTranslation", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
                
                {options.enableTranslation && (
                  <>
                    <div className="border-border border-t my-3"></div>
                    
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">Default Target Language</h3>
                      <select
                        value={options.targetLanguage}
                        onChange={(e) => handleOptionChange("targetLanguage", e.target.value)}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-semibold">History</h2>
              
              <div className="space-y-1 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Enable History</h3>
                    <p className="text-muted-foreground text-xs">
                      Save copied content to local history for later access.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.enableHistory}
                    onChange={(e) => handleOptionChange("enableHistory", e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                </div>
                
                {options.enableHistory && (
                  <>
                    <div className="border-border border-t my-3"></div>
                    
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">Maximum History Items</h3>
                      <select
                        value={options.maxHistoryItems}
                        onChange={(e) => handleOptionChange("maxHistoryItems", Number(e.target.value))}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value={50}>50 items</option>
                        <option value={100}>100 items</option>
                        <option value={200}>200 items</option>
                        <option value={500}>500 items</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
