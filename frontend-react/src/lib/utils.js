import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine conditional Tailwind classes and resolve conflicting utilities.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
