import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString, includeTime = false) {
  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return "Invalid date"
  }

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  return new Intl.DateTimeFormat("en-US", options).format(date)
}
