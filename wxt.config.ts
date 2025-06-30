import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "wxt"

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "cpdown",
    action: {},
    description: "Copy any webpage/YouTube subtitle as clean markdown",
    commands: {
      "copy-as-markdown": {
        suggested_key: {
          default: "Ctrl+Shift+T",
          mac: "Ctrl+T",
        },
        description: "Copy current page as clean markdown",
      },
    },
    permissions: ["activeTab", "clipboardWrite", "scripting", "storage"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    plugins: [
      //
      tailwindcss(),
      tsconfigPaths(),
    ],
  }),
})
