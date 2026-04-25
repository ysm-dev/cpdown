import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "wxt"

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "cpdown",
    action: {},
    description: "Copy any webpage/YouTube subtitle as clean markdown with translation and history",
    commands: {
      "copy-as-markdown": {
        suggested_key: {
          default: "Ctrl+Shift+T",
          mac: "Ctrl+T",
        },
        description: "Copy current page as clean markdown",
      },
      "_execute_side_panel": {
        suggested_key: {
          default: "Ctrl+Shift+Y",
          mac: "Ctrl+Shift+Y",
        },
      },
    },
    permissions: [
      "activeTab", 
      "clipboardWrite", 
      "scripting", 
      "storage",
      "sidePanel"
    ],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      {
        resources: ["youtube-main-world.js"],
        matches: ["*://*.youtube.com/*"],
      },
    ],
    side_panel: {
      default_path: "sidebar.html",
    },
  },
  vite: () => ({
    plugins: [
      //
      tailwindcss(),
      tsconfigPaths(),
    ],
  }),
})
