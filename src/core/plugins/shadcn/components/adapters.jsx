import React from "react"

import { Button as ShadcnButton } from "../../../../shadcn/components/ui/button"
import { Input as ShadcnInput } from "../../../../shadcn/components/ui/input"
import { Toaster } from "../../../../shadcn/components/ui/toaster"

export const ShadcnButtonAdapter = (props) => (
  <ShadcnButton variant="outline" size="sm" {...props} />
)

export const ShadcnInputAdapter = (props) => <ShadcnInput {...props} />

export const withToaster = (Original) => {
  const WithToaster = (props) => (
    <>
      <Original {...props} />
      <Toaster position="bottom-right" closeButton />
    </>
  )

  return WithToaster
}
