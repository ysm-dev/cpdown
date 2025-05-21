import { browser } from "wxt/browser"

export type OptionsState = {
  useReadability: boolean
  showSuccessToast: boolean
  showConfetti: boolean
}

export const defaultOptions: OptionsState = {
  useReadability: true,
  showSuccessToast: true,
  showConfetti: false,
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
