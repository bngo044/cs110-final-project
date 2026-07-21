import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "../../lib/utils"

// Radix Label connects accessible label text to its matching form control.
function Label({ className, ...props }) {
  return <LabelPrimitive.Root className={cn("text-sm font-medium", className)} {...props} />
}

export { Label }
