import { Toaster, toast } from "sonner"

export function showNotification(message: string) {
  toast.success(message)
}

export const Noti = () => {
  return <Toaster position="top-right" richColors closeButton />
}

export const getRoot = () => {
  let root = document.getElementById("cpdown-notification")

  if (!root) {
    root = document.createElement("div")
    root.id = "cpdown-notification"
    document.body.appendChild(root)
  }

  return root
}
