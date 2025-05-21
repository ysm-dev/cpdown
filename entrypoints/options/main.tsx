import { App } from "@/entrypoints/options/App.tsx"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

createRoot(document.body).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
