# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun run dev` - Start development mode with hot reload using WXT
- `bun run dev:firefox` - Start development mode for Firefox (MV2)
- `bun run build` - Build the extension for production
- `bun run build:firefox` - Build for Firefox specifically
- `bun run compile` - Run TypeScript type checking without emitting files

### Distribution
- `bun run zip` - Create Chrome extension zip for distribution
- `bun run zip:firefox` - Create Firefox extension zip
- `bun run submit` - Submit to Chrome Web Store (requires setup)

### Maintenance
- `bun run pkg:check` - Check for package updates
- `bun run pkg:bump` - Update packages to latest versions

## Architecture Overview

### Web Extension Framework
This project uses **WXT** (Web Extension Toolkit) for cross-browser compatibility. The extension targets Manifest V3 for Chrome and can build MV2 versions for Firefox.

### Core Components
- **Background Script** (`entrypoints/background.ts`) - Handles extension icon clicks, keyboard shortcuts, and coordinates with content scripts
- **Content Script** (`entrypoints/content.tsx`) - Main processing logic that converts webpage content to markdown
- **Options Page** (`entrypoints/options/`) - React-based settings UI with shadcn/ui components

### Content Processing Pipeline
The extension supports three content extraction modes:
1. **Defuddle** - Advanced content extraction and markdown cleanup (default)
2. **Mozilla Readability** - Article extraction using Mozilla's Readability algorithm
3. **Basic Turndown** - Direct HTML to markdown conversion

### YouTube Integration
Special handling for YouTube videos:
- Extracts video information via YouTube's internal API
- Downloads and converts SRT subtitles to clean markdown
- Includes video title and formatted transcript

## Key Libraries and Dependencies

### Processing
- `defuddle` - Main content extraction and cleanup
- `@mozilla/readability` - Alternative article extraction
- `turndown` - HTML to markdown conversion
- `js-tiktoken` - Token counting for LLM usage estimation

### UI Framework
- `react` & `react-dom` - Options page UI
- `@radix-ui/react-switch` - Toggle components
- `sonner` - Toast notifications
- `tailwindcss` - Utility-first CSS framework

### Utilities
- `@fxts/core` - Functional programming utilities (memoization)
- `ofetch` - HTTP client for API requests
- `srt-parser-2` - SRT subtitle parsing

## Storage and State Management

Options are stored using the browser's `storage.sync` API with the following structure:
- `useDeffudle`: boolean - Use Defuddle for content processing
- `useReadability`: boolean - Use Mozilla Readability (mutually exclusive with Defuddle)
- `wrapInTripleBackticks`: boolean - Wrap output in markdown code blocks
- `showSuccessToast`: boolean - Show success notifications
- `showConfetti`: boolean - Trigger Raycast confetti animation

## Code Organization

### Path Aliases
The project uses TypeScript path aliases with `@/` pointing to the root directory for clean imports.

### Key Modules
- `/lib/storage.ts` - Typed storage management with defaults
- `/lib/showNotification.tsx` - Toast notification system
- `/lib/tagsToRemove.ts` - HTML elements to filter during conversion
- `/lib/yt/` - YouTube-specific utilities for video info and subtitle extraction

### Component Structure
- `/components/ToggleOption.tsx` - Reusable settings toggle component
- `/components/ui/` - shadcn/ui component library integration

## Development Workflow

### Linting and Formatting
The project uses **Biome** instead of ESLint/Prettier with comprehensive rules configured in `biome.jsonc`. Code is automatically formatted with:
- 2-space indentation
- 80 character line width
- Semicolons as needed
- Sorted imports and Tailwind classes

### Extension Testing
Load the unpacked extension during development:
1. Run `bun run dev`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `.output/chrome-mv3`

### Cross-browser Compatibility
- Chrome: Uses Manifest V3 by default
- Firefox: Use `dev:firefox` and `build:firefox` commands for MV2 compatibility

## Debugging Notes

### Content Script Communication
The extension uses message passing between background and content scripts:
- `COPY_TEXT` - Process regular webpage content
- `COPY_YOUTUBE_SUBTITLE` - Handle YouTube video subtitles
- `OPEN_CONFETTI` - Trigger Raycast confetti (background only)

### YouTube API Integration
YouTube data is fetched using internal YouTube API endpoints. The implementation includes comprehensive TypeScript interfaces for the YouTube API response structure.

### Error Handling
- Defuddle processing includes fallback to basic Turndown on errors
- Storage operations have try-catch blocks with console error logging
- Missing subtitles or video info are handled gracefully