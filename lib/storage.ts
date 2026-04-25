import { browser } from "wxt/browser"

export type OptionsState = {
  useDeffudle: boolean
  useReadability: boolean
  wrapInTripleBackticks: boolean
  showSuccessToast: boolean
  showConfetti: boolean
  enableTranslation: boolean
  targetLanguage: string
  enableHistory: boolean
  maxHistoryItems: number
}

export const defaultOptions: OptionsState = {
  useDeffudle: true,
  useReadability: false,
  wrapInTripleBackticks: true,
  showSuccessToast: true,
  showConfetti: false,
  enableTranslation: true,
  targetLanguage: "zh-CN",
  enableHistory: true,
  maxHistoryItems: 100,
}

export const supportedLanguages = [
  { code: "zh-CN", name: "简体中文" },
  { code: "zh-TW", name: "繁體中文" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
]

export type HistoryItem = {
  id: string
  content: string
  title: string
  url: string
  type: "webpage" | "subtitle" | "selection"
  timestamp: number
  tokenCount: number
}

export async function getOptions(): Promise<OptionsState> {
  try {
    const result = await browser.storage.sync.get(Object.keys(defaultOptions))
    return { ...defaultOptions, ...result }
  } catch (error) {
    console.error("Error getting options:", error)
    return defaultOptions
  }
}

export async function saveOptions(
  options: Partial<OptionsState>,
): Promise<void> {
  try {
    await browser.storage.sync.set(options)
  } catch (error) {
    console.error("Error saving options:", error)
  }
}

export async function resetOptions(): Promise<void> {
  try {
    await browser.storage.sync.clear()
  } catch (error) {
    console.error("Error resetting options:", error)
  }
}

const HISTORY_KEY = "cpdown_history"

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const result = await browser.storage.local.get(HISTORY_KEY)
    return (result[HISTORY_KEY] as HistoryItem[]) || []
  } catch (error) {
    console.error("Error getting history:", error)
    return []
  }
}

export async function addToHistory(item: Omit<HistoryItem, "id" | "timestamp">): Promise<HistoryItem> {
  try {
    const options = await getOptions()
    if (!options.enableHistory) {
      return {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }
    }

    const history = await getHistory()
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    history.unshift(newItem)

    if (history.length > options.maxHistoryItems) {
      history.splice(options.maxHistoryItems)
    }

    await browser.storage.local.set({ [HISTORY_KEY]: history })
    return newItem
  } catch (error) {
    console.error("Error adding to history:", error)
    return {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
  }
}

export async function removeFromHistory(id: string): Promise<void> {
  try {
    const history = await getHistory()
    const filteredHistory = history.filter((item) => item.id !== id)
    await browser.storage.local.set({ [HISTORY_KEY]: filteredHistory })
  } catch (error) {
    console.error("Error removing from history:", error)
  }
}

export async function removeMultipleFromHistory(ids: string[]): Promise<void> {
  try {
    const history = await getHistory()
    const filteredHistory = history.filter((item) => !ids.includes(item.id))
    await browser.storage.local.set({ [HISTORY_KEY]: filteredHistory })
  } catch (error) {
    console.error("Error removing multiple from history:", error)
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await browser.storage.local.remove(HISTORY_KEY)
  } catch (error) {
    console.error("Error clearing history:", error)
  }
}
