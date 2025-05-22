# cpdown

<div align="center">
  <img src="./public/icon/128.png" alt="cpdown logo" width="100" height="100" />
  <p><em>Copy any webpage as clean markdown.</em></p>
</div>

## Overview

cpdown is a browser extension that allows you to copy the content of any webpage as clean, formatted markdown. It uses Mozilla's Readability (the same technology behind Firefox's Reader View) to extract the main content from a webpage, removing clutter like ads, navigation, and sidebars.

<div align="center">
  <!-- 
  To make this video work on GitHub:
  1. Create a new issue or discussion in your repository
  2. Drag and drop video/record.mp4 into the comment box
  3. Wait for it to upload, then copy the generated URL
  4. Replace the URL below with the one GitHub gives you
  5. Delete these instructions
  -->
  
  ![Demo Video](https://github.com/ysm-dev/cpdown/raw/refs/heads/main/video/record.mp4)
</div>

## Features

- 📋 Copy any webpage content as clean markdown with one click (or keyboard shortcut)
- 📖 Uses Mozilla's Readability to extract the main content
- 🔍 Removes unnecessary HTML elements (scripts, styles, iframes, etc.)
- 🔢 Shows token count for the copied content (for LLM)
- ⌨️ Keyboard shortcut support (Cmd+Ctrl+T on Mac, Ctrl+Shift+T on Windows/Linux)

## Installation

### Chrome Web Store

[Install cpdown from the Chrome Web Store](#) (Coming soon)

### Manual Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   bun i
   ```
3. Build the extension:
   ```bash
   bun run build
   ```
4. Load the unpacked extension:
   - Open Chrome/Edge and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `.output/chrome-mv3` directory

## Usage

1. Navigate to any webpage you want to copy
2. Click the cpdown icon in your browser toolbar, or use the keyboard shortcut
3. The page content will be copied to your clipboard as markdown
4. Paste the markdown content anywhere you need it

## Settings

cpdown offers several configuration options:

- **Use Mozilla Readability**: Parse webpage content using Readability for cleaner markdown output
- **Show Success Toast**: Display a notification when content is successfully copied
- **Show Raycast Confetti**: Celebrate successful copying with a confetti animation (for Raycast users)

## Development

This extension is built with:

- [WXT](https://wxt.dev/) - The Web Extension Toolkit
- [React](https://react.dev/) - For the options UI
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [Mozilla Readability](https://github.com/mozilla/readability) - For content extraction
- [Turndown](https://github.com/mixmark-io/turndown) - For HTML to Markdown conversion
- [js-tiktoken](https://github.com/dqbd/tiktoken) - For token counting

### Development Commands

```bash
bun run dev
```

## License

[MIT](LICENSE)

## Acknowledgements

- [Mozilla Readability](https://github.com/mozilla/readability) for the content extraction algorithm
- [Turndown](https://github.com/mixmark-io/turndown) for the HTML to Markdown conversion
- [Raycast](https://www.raycast.com/) for the confetti animation integration
