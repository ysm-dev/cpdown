import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "wxt"

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "cpdown",
    action: {},
    description: "Copy any webpage as clean markdown",
    commands: {
      "copy-as-markdown": {
        suggested_key: {
          default: "Ctrl+Shift+T",
          mac: "Command+Ctrl+T",
        },
        description: "Copy current page as clean markdown",
      },
    },
    permissions: ["activeTab", "clipboardWrite", "scripting", "storage"],
  },
  vite: () => ({
    plugins: [
      //
      tailwindcss(),
      tsconfigPaths(),
    ],
  }),
})
