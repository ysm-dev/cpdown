import { ofetch } from "ofetch"

interface TranslationResult {
  success: boolean
  translatedText?: string
  error?: string
}

export async function translateText(
  text: string,
  targetLanguage: string = "zh-CN",
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { success: false, error: "Text is empty" }
  }

  try {
    if (typeof window !== "undefined" && (window as any).translation) {
      try {
        const result = await (window as any).translation.translate(text, targetLanguage)
        if (result) {
          return { success: true, translatedText: result }
        }
      } catch (apiError) {
        console.log("Browser translation API failed, trying fallback:", apiError)
      }
    }

    const result = await translateWithGoogleMyMemory(text, targetLanguage)
    return result
  } catch (error) {
    console.error("Translation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

async function translateWithGoogleMyMemory(
  text: string,
  targetLanguage: string,
): Promise<TranslationResult> {
  try {
    const langPair = `auto|${targetLanguage}`

    const response = await ofetch(
      "https://api.mymemory.translated.net/get",
      {
        method: "GET",
        params: {
          q: text,
          langpair: langPair,
        },
      },
    )

    if (response.responseStatus === 200 && response.responseData) {
      return {
        success: true,
        translatedText: response.responseData.translatedText,
      }
    }

    return {
      success: false,
      error: response.responseDetails || "Translation failed",
    }
  } catch (error) {
    console.error("Google MyMemory translation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation service unavailable",
    }
  }
}

export async function translateMarkdown(
  markdown: string,
  targetLanguage: string = "zh-CN",
): Promise<TranslationResult> {
  if (!markdown || markdown.trim().length === 0) {
    return { success: false, error: "Markdown is empty" }
  }

  const codeBlocks: string[] = []
  const inlineCode: string[] = []
  const links: string[] = []
  const images: string[] = []

  let processedText = markdown

  processedText = processedText.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  processedText = processedText.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match)
    return `__INLINE_CODE_${inlineCode.length - 1}__`
  })

  processedText = processedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
    images.push(match)
    return `__IMAGE_${images.length - 1}__`
  })

  processedText = processedText.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    links.push(match)
    return `__LINK_${links.length - 1}__`
  })

  const paragraphs = processedText.split(/\n\n+/)
  const translatedParagraphs: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      translatedParagraphs.push("")
      continue
    }

    if (
      paragraph.startsWith("__CODE_BLOCK_") ||
      paragraph.startsWith("__INLINE_CODE_") ||
      paragraph.startsWith("__LINK_") ||
      paragraph.startsWith("__IMAGE_")
    ) {
      translatedParagraphs.push(paragraph)
      continue
    }

    if (paragraph.startsWith("#") || paragraph.startsWith("-") || paragraph.startsWith("*") || paragraph.match(/^\d+\./)) {
      const result = await translateText(paragraph, targetLanguage)
      if (result.success && result.translatedText) {
        translatedParagraphs.push(result.translatedText)
      } else {
        translatedParagraphs.push(paragraph)
      }
      continue
    }

    const result = await translateText(paragraph, targetLanguage)
    if (result.success && result.translatedText) {
      translatedParagraphs.push(result.translatedText)
    } else {
      translatedParagraphs.push(paragraph)
    }
  }

  let translatedText = translatedParagraphs.join("\n\n")

  codeBlocks.forEach((block, index) => {
    translatedText = translatedText.replace(`__CODE_BLOCK_${index}__`, block)
  })

  inlineCode.forEach((code, index) => {
    translatedText = translatedText.replace(`__INLINE_CODE_${index}__`, code)
  })

  images.forEach((image, index) => {
    translatedText = translatedText.replace(`__IMAGE_${index}__`, image)
  })

  links.forEach((link, index) => {
    translatedText = translatedText.replace(`__LINK_${index}__`, link)
  })

  return {
    success: true,
    translatedText,
  }
}

export function formatLanguageCode(code: string): string {
  const langMap: Record<string, string> = {
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    "zh": "zh-CN",
    "en": "en",
    "en-US": "en",
    "en-GB": "en",
    "ja": "ja",
    "ko": "ko",
    "fr": "fr",
    "de": "de",
    "es": "es",
  }

  return langMap[code] || code
}
