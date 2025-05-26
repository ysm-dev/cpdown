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

    let newOptions = { ...options, [key]: value }

    if (key === "useReadability" && value) {
      newOptions = { ...newOptions, useDeffudle: false }
    } else if (key === "useDeffudle" && value) {
      newOptions = { ...newOptions, useReadability: false }
    }

    setOptions(newOptions)
    await saveOptions(newOptions)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-background p-4 text-foreground">
      <header className="mb-4">
        <h1 className="font-bold text-xl">Settings</h1>
      </header>

      <div className="space-y-1 rounded-lg border border-border bg-card p-6">
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

            {/* wrap in triple backticks */}
            <ToggleOption
              title="Wrap in triple backticks"
              description="Wrap the copied markdown in triple backticks"
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

      <footer className="mt-4 text-center text-muted-foreground text-xs">
        <p>
          cpdown v{packageJson.version} — Copy any webpage as clean markdown
        </p>
      </footer>
    </div>
  )
}
