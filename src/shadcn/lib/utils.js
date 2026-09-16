import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge needs to know about the `ui-` prefix so conflicting classes
// coming from swagger-ui props are resolved correctly.
const twMerge = extendTailwindMerge({ prefix: "ui-" })

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
