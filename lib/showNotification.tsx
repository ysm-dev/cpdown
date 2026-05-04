import { Toaster, toast } from "sonner"

export function showNotification(
  message: string,
  type: "success" | "error" | "warning" | "info" = "success",
) {
  switch (type) {
    case "error":
      toast.error(message)
      break
    case "warning":
      toast.warning(message)
      break
    case "info":
      toast.info(message)
      break
    case "success":
    default:
      toast.success(message)
      break
  }
}

export const Noti = () => {
  return <Toaster position="top-right" richColors closeButton />
}
