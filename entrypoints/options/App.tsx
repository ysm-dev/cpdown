import { useEffect, useState } from "react"
import { ToggleOption } from "@/components/ToggleOption"
import { getOptions, type OptionsState, saveOptions } from "@/lib/storage"
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
              description="Celebrate successful copying with a confetti animation. Tip: the first time Chrome may ask 'Open Raycast.app?'. Visit https://raycast.com/confetti once and check 'Always allow www.raycast.com to open links of this type' to stop seeing that prompt."
              checked={options.showConfetti}
              onCheckedChange={(checked) =>
                handleOptionChange("showConfetti", checked)
              }
              infoLink="https://x.com/raycastapp/status/1691464764516343808"
            />

            <div className="border-border border-t"></div>

            <ToggleOption
              title="排版优化 - 去除冗余换行"
              description="开启后自动清理复制内容中多余的空行，让文本阅读更整洁流畅"
              checked={options.removeRedundantNewlines}
              onCheckedChange={(checked) =>
                handleOptionChange("removeRedundantNewlines", checked)
              }
            />

            <div className="border-border border-t"></div>

            <ToggleOption
              title="资料溯源增强"
              description="开启后复制正文时，自动拼接附带网页标题、原始来源链接、实时复制时间信息，统一排版展示"
              checked={options.enableSourceTracking}
              onCheckedChange={(checked) =>
                handleOptionChange("enableSourceTracking", checked)
              }
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
