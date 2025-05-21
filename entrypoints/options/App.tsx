// import "@/assets/tailwind.css"

import { ToggleOption } from "@/components/ToggleOption"
import { type OptionsState, getOptions, saveOptions } from "@/lib/storage"
import { useEffect, useState } from "react"
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
    value: boolean,
  ) => {
    if (!options) return

    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    await saveOptions({ [key]: value })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-background p-6 text-foreground">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-2xl">Settings</h1>
      </header>

      <div className="flex-1 space-y-1 rounded-lg border border-border bg-card p-6 shadow-sm">
        {options && (
          <>
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
              description="Celebrate successful copying with a confetti animation"
              checked={options.showConfetti}
              onCheckedChange={(checked) =>
                handleOptionChange("showConfetti", checked)
              }
              infoLink="https://x.com/raycastapp/status/1691464764516343808"
            />
          </>
        )}
      </div>

      <footer className="mt-8 text-center text-muted-foreground text-xs">
        <p>
          cpdown v{packageJson.version} — Copy any webpage as clean markdown
        </p>
      </footer>
    </div>
  )
}
