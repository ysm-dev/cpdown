export function showNotification(message: string, isError = false) {
  // Create notification element
  const notification = document.createElement("div")
  notification.style.position = "fixed"
  notification.style.top = "20px"
  notification.style.right = "20px"
  notification.style.padding = "10px 20px"
  notification.style.borderRadius = "4px"
  notification.style.backgroundColor = isError ? "#f44336" : "#4CAF50"
  notification.style.color = "white"
  notification.style.zIndex = "10000"
  notification.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)"
  notification.textContent = message

  // Add to page
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.5s"

    setTimeout(() => {
      document.body.removeChild(notification)
    }, 500)
  }, 3000)
}
