import * as React from "react"
import { Toaster as Sonner } from "sonner"

function useDarkMode() {
  const [dark, setDark] = React.useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark-mode")
  )

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined

    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setDark(root.classList.contains("dark-mode"))
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  return dark
}

const Toaster = (props) => {
  const dark = useDarkMode()

  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      className="ui-toaster ui-group"
      {...props}
    />
  )
}

export { Toaster }
