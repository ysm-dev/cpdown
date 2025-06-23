import type React from "react"
import { Switch } from "@/components/ui/switch"

type ToggleOptionProps = {
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  infoLink?: string
}

export const ToggleOption: React.FC<ToggleOptionProps> = ({
  title,
  description,
  checked,
  onCheckedChange,
  infoLink,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm leading-none">{title}</h3>
          {infoLink && (
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </a>
          )}
        </div>
        {description && (
          <p className="text-pretty text-muted-foreground text-xs">
            {description}
          </p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
