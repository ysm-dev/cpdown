import React, { useEffect } from "react"
import { showNotification } from "@/lib/showNotification"

export interface Track {
  baseUrl: string
  name: { simpleText: string }
  languageCode: string
  kind?: string
}

interface SubtitleSelectorProps {
  tracks: Track[]
  onSelect: (track: Track) => void
  onClose: () => void
}

export const SubtitleSelector: React.FC<SubtitleSelectorProps> = ({
  tracks,
  onSelect,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 w-64 max-h-[80vh] overflow-y-auto flex flex-col gap-2 font-sans text-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Select Subtitle
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          type="button"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {tracks.map((track, index) => (
          <button
            key={`${track.languageCode}-${index}`}
            onClick={() => onSelect(track)}
            className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 truncate"
            type="button"
          >
            {track.name.simpleText}
            {track.kind === "asr" && (
              <span className="ml-2 text-xs text-zinc-400 italic">
                (Auto)
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
